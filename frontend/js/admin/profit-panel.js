import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money, shortDate, todayDate } from '../utils/format.js';
import { splitAmount } from '../utils/money.js';
import { escapeHtml, inlineArg } from '../utils/html.js';
import { setStatus } from '../ui/status.js';

async function reloadAdmin() {
  const { loadAdmin } = await import('./admin-data.js');
  return loadAdmin();
}

function setProfitStatus(message, type = '') {
  setStatus($('profitFormStatus'), message, type);
}

function updateProfitPeriodLabel() {
  const label = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  $('profitPeriodLabel').textContent = `Periodo atual: ${label}`;
  $('profitCashBadge').textContent = 'Caixa aberto';
  $('profitCashBadge').className = 'badge confirmed';
  if (!$('profitEntryDate').value) $('profitEntryDate').value = todayDate();
}

function profitBarberById(id) {
  return state.barbersCache.find((barber) => barber.id === id);
}

function profitCommissionForBarber(id) {
  return Number(profitBarberById(id)?.commissionPercentage ?? 50);
}

function profitAppointmentById(id) {
  return state.adminAppointmentsCache.find((appointment) => appointment.id === id);
}

function normalizeProfitBarbers(profit) {
  const profitByBarber = new Map((profit?.barbers || []).map((item) => [item.barberId, item]));
  state.barbersCache = state.barbersCache.map((barber) => {
    const profitBarber = profitByBarber.get(barber.id);
    return {
      ...barber,
      commissionPercentage: Number(profitBarber?.commissionPercentage ?? barber.commissionPercentage ?? 50)
    };
  });
}

export function updateProfitPreview() {
  const amount = Number($('profitAmountInput').value || 0);
  const commission = Number($('profitCommissionInput').value || 0);
  const split = splitAmount(amount, commission);

  $('profitPreviewGross').textContent = money(split.gross);
  $('profitPreviewBarber').textContent = money(split.barber);
  $('profitPreviewHouse').textContent = money(split.house);
}

function updateProfitMetrics() {
  $('profitGrossMetric').textContent = money(state.profitCurrentTotals.gross);
  $('profitHouseMetric').textContent = money(state.profitCurrentTotals.house);
  $('profitBarberMetric').textContent = money(state.profitCurrentTotals.barber);
  $('profitEntriesMetric').textContent = state.profitCurrentTotals.entries;
}

function completedProfitEntries() {
  const metaByAppointment = new Map(
    state.profitEntriesCache
      .filter((entry) => entry.appointmentId)
      .map((entry) => [entry.appointmentId, entry])
  );

  const fromAppointments = state.adminAppointmentsCache
    .filter((appointment) => appointment.status === 'COMPLETED')
    .map((appointment) => {
      const meta = metaByAppointment.get(appointment.id);
      const barberId = appointment.barberId;
      const commission = Number(meta?.commissionPercentage ?? profitCommissionForBarber(barberId));
      const amount = Number(meta?.amount ?? appointment.price ?? 0);

      return {
        id: appointment.id,
        localEntryId: meta?.id || null,
        date: appointment.date,
        source: appointment.serviceName || 'Atendimento',
        barberId,
        barberName: appointment.barberName || profitBarberById(barberId)?.name || '-',
        amount,
        commissionPercentage: commission,
        paymentMethod: meta?.paymentMethod || '-',
        notes: meta?.notes || '',
        persisted: true,
        canDelete: Boolean(meta),
        fromProfitEntry: Boolean(meta)
      };
    });

  const manualEntries = state.profitEntriesCache
    .filter((entry) => !entry.appointmentId)
    .map((entry) => ({
      ...entry,
      localEntryId: entry.id,
      persisted: false,
      canDelete: true,
      fromProfitEntry: true
    }));
  return [...manualEntries, ...fromAppointments].sort((a, b) => {
    const dateOrder = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateOrder) return dateOrder;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function calculateProfitTotals(entries) {
  return entries.reduce((totals, entry) => {
    const split = splitAmount(entry.amount, entry.commissionPercentage);

    totals.gross = Number((totals.gross + split.gross).toFixed(2));
    totals.barber = Number((totals.barber + split.barber).toFixed(2));
    totals.house = Number((totals.house + split.house).toFixed(2));
    totals.entries += 1;
    return totals;
  }, { gross: 0, barber: 0, house: 0, entries: 0 });
}

function validateProfitPeriodFilter() {
  const startDate = $('profitPeriodStartDate').value;
  const endDate = $('profitPeriodEndDate').value;

  if (startDate && endDate && startDate > endDate) {
    throw new Error('A data inicio nao pode ser maior que a data fim.');
  }

  return { startDate, endDate };
}

function entriesInProfitPeriod(entries) {
  const { startDate, endDate } = validateProfitPeriodFilter();
  return entries.filter((entry) => {
    const entryDate = String(entry.date || '').slice(0, 10);
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });
}

function updateProfitFilterStatus() {
  const startDate = $('profitPeriodStartDate').value;
  const endDate = $('profitPeriodEndDate').value;
  const hasFilter = startDate || endDate;
  const message = hasFilter
    ? `Periodo filtrado: ${startDate ? shortDate(startDate) : 'inicio'} ate ${endDate ? shortDate(endDate) : 'hoje'}`
    : 'Exibindo todos os lucros e cortes realizados.';

  setStatus($('profitPeriodFilterStatus'), message, hasFilter ? 'ok' : '');
}

function filteredProfitEntries() {
  return entriesInProfitPeriod(completedProfitEntries());
}

function renderProfitSplit(entries) {
  const grouped = new Map();

  entries.forEach((entry) => {
    const id = entry.barberId || 'house';
    const current = grouped.get(id) || {
      barberId: id,
      barberName: entry.barberName || 'Servico da casa',
      amount: 0,
      barberShare: 0,
      houseShare: 0,
      services: 0,
      commissionSum: 0
    };
    const split = splitAmount(entry.amount, entry.commissionPercentage);

    current.amount = Number((current.amount + split.gross).toFixed(2));
    current.barberShare = Number((current.barberShare + split.barber).toFixed(2));
    current.houseShare = Number((current.houseShare + split.house).toFixed(2));
    current.services += 1;
    current.commissionSum += Number(entry.commissionPercentage || 0);
    grouped.set(id, current);
  });

  const rows = [...grouped.values()].sort((a, b) => b.amount - a.amount);
  if (rows.length === 0) {
    $('profitSplitList').innerHTML = '<article class="empty">Nenhum lucro lancado ainda.</article>';
    return;
  }

  const maxAmount = Math.max(...rows.map((row) => row.amount), 1);
  $('profitSplitList').innerHTML = rows.map((row) => {
    const averageCommission = row.services ? row.commissionSum / row.services : 0;
    const initial = row.barberName.trim().charAt(0).toUpperCase() || 'C';
    const width = Math.max(6, Math.round((row.amount / maxAmount) * 100));

    return `
      <article class="item split-card">
        <div class="avatar-token">${escapeHtml(initial)}</div>
        <div>
          <strong>${escapeHtml(row.barberName)}</strong>
          <small>${row.services} lancamentos | Comissao media ${averageCommission.toFixed(1)}%</small>
          <div class="progress-track"><div class="progress-fill" style="width: ${width}%"></div></div>
        </div>
        <div class="split-values">
          <span>Ganho acumulado <strong>${money(row.barberShare)}</strong></span>
          <span>Casa <strong>${money(row.houseShare)}</strong></span>
        </div>
      </article>
    `;
  }).join('');
}

function renderProfitHistory(entries) {
  const header = '<div class="history-row header"><span>Lancamento</span><span>Profissional</span><span>Valor</span><span>Divisao</span></div>';
  const rows = entries.slice(0, 20).map((entry) => {
    const commission = Number(entry.commissionPercentage || 0);
    const linked = entry.persisted ? 'Sistema' : 'Manual';
    const deleteButton = entry.canDelete
      ? `<button class="ghost danger-text profit-delete-button" type="button" onclick="deleteProfitEntry(${inlineArg(entry.localEntryId)})">Apagar</button>`
      : '';
    return `
      <article class="history-row" title="${escapeHtml(entry.paymentMethod || '')}">
        <strong>${escapeHtml(entry.source)}<br><small>${shortDate(entry.date)} | ${linked}</small></strong>
        <span>${escapeHtml(entry.barberName || 'Servico da casa')}</span>
        <span>${money(entry.amount)}</span>
        <span class="history-split-cell">${commission}% / ${(100 - commission).toFixed(1).replace('.0', '')}%${deleteButton}</span>
      </article>
    `;
  }).join('');

  $('profitHistoryTable').innerHTML = rows
    ? `${header}${rows}`
    : `${header}<article class="empty">Nenhum lancamento encontrado.</article>`;
}

export async function deleteProfitEntry(localEntryId) {
  if (!localEntryId) return;
  if (!confirm('Apagar este lancamento?')) return;

  try {
    setProfitStatus('Apagando lancamento...');
    await api(`/api/admin/profit-entries/${localEntryId}`, { method: 'DELETE' });
    await reloadAdmin();
    setProfitStatus('Lancamento apagado.', 'ok');
  } catch (error) {
    setProfitStatus(error.message, 'error');
  }
}

export function renderProfitPanel() {
  let entries = [];

  try {
    entries = filteredProfitEntries();
    updateProfitFilterStatus();
  } catch (error) {
    setStatus($('profitPeriodFilterStatus'), error.message, 'error');
  }

  state.profitCurrentTotals = calculateProfitTotals(entries);
  updateProfitMetrics();
  renderProfitSplit(entries);
  renderProfitHistory(entries);
  renderCommissionList();
  populateProfitAppointmentSelect();
}

function renderCommissionList() {
  const list = $('profitCommissionList');
  if (!list) return;

  const barbers = state.barbersCache.filter((barber) => barber.id);
  if (!barbers.length) {
    list.innerHTML = '<article class="empty">Nenhum barbeiro cadastrado.</article>';
    return;
  }

  list.innerHTML = barbers.map((barber) => {
    const commission = Number(barber.commissionPercentage ?? 50);
    return `
      <article class="item">
        <div class="item-head">
          <strong>${escapeHtml(barber.name)}</strong>
        </div>
        <div class="commission-row">
          <label>
            <span>Comissao %</span>
            <input id="commission-${escapeHtml(barber.id)}" type="number" min="0" max="100" step="0.5" value="${commission}" />
          </label>
          <button class="ghost" type="button" onclick="saveCommission(${inlineArg(barber.id)})">Salvar</button>
        </div>
      </article>
    `;
  }).join('');
}

export async function saveCommission(barberId) {
  const input = document.getElementById(`commission-${barberId}`);
  if (!input) return;

  try {
    await api(`/api/admin/barbers/${barberId}/commission`, {
      method: 'PUT',
      body: JSON.stringify({ commissionPercentage: input.value })
    });
    await reloadAdmin();
    setProfitStatus('Comissao atualizada.', 'ok');
  } catch (error) {
    setProfitStatus(error.message, 'error');
  }
}

function populateProfitBarbers() {
  const options = state.barbersCache.map((barber) => `
    <option value="${escapeHtml(barber.id)}" data-rate="${escapeHtml(barber.commissionPercentage)}">
      ${escapeHtml(barber.name)}
    </option>
  `);

  $('profitEntryBarberSelect').innerHTML = [
    ...options,
    '<option value="house" data-rate="0">Servico da casa</option>'
  ].join('');
}

function populateProfitServices() {
  const serviceOptions = state.servicesCache.map((service) => `
    <option value="${escapeHtml(service.name)}" data-price="${escapeHtml(service.price)}">
      ${escapeHtml(service.name)}
    </option>
  `);

  $('profitSourceSelect').innerHTML = [
    ...serviceOptions,
    '<option value="Produto vendido" data-price="0">Produto vendido</option>',
    '<option value="Pacote mensal" data-price="0">Pacote mensal</option>',
    '<option value="Entrada avulsa" data-price="0">Entrada avulsa</option>'
  ].join('');
}

function populateProfitAppointmentSelect() {
  const pendingAppointments = state.adminAppointmentsCache.filter((appointment) => appointment.status !== 'COMPLETED');
  const options = pendingAppointments.map((appointment) => `
    <option value="${escapeHtml(appointment.id)}">
      ${shortDate(appointment.date)} - ${escapeHtml(String(appointment.time || '').slice(0, 5))} - ${escapeHtml(appointment.customerName || 'Cliente')} - ${escapeHtml(appointment.serviceName || 'Servico')}
    </option>
  `);

  $('profitAppointmentSelect').innerHTML = [
    '<option value="">Lancamento manual</option>',
    ...options
  ].join('');
}

export function syncProfitFormFromBarber() {
  const selected = $('profitEntryBarberSelect').selectedOptions[0];
  $('profitCommissionInput').value = selected?.dataset.rate ?? 50;
  updateProfitPreview();
}

export function syncProfitFormFromService() {
  const price = Number($('profitSourceSelect').selectedOptions[0]?.dataset.price || 0);
  if (price > 0) $('profitAmountInput').value = price.toFixed(2);
  updateProfitPreview();
}

export function syncProfitFormFromAppointment() {
  const appointment = profitAppointmentById($('profitAppointmentSelect').value);
  if (!appointment) return;

  $('profitEntryDate').value = String(appointment.date || todayDate()).slice(0, 10);
  $('profitEntryBarberSelect').value = appointment.barberId;
  $('profitSourceSelect').value = appointment.serviceName || $('profitSourceSelect').value;
  $('profitAmountInput').value = Number(appointment.price || 0).toFixed(2);
  syncProfitFormFromBarber();
}

export function hydrateProfitPanel(profit) {
  normalizeProfitBarbers(profit);
  updateProfitPeriodLabel();
  populateProfitBarbers();
  populateProfitServices();
  populateProfitAppointmentSelect();
  syncProfitFormFromBarber();
  syncProfitFormFromService();
  renderProfitPanel();
  setProfitStatus('');
}

export function buildProfitEntry() {
  const barberId = $('profitEntryBarberSelect').value;
  const barber = profitBarberById(barberId);

  return {
    id: `local-${Date.now()}`,
    appointmentId: $('profitAppointmentSelect').value || null,
    date: $('profitEntryDate').value || todayDate(),
    source: $('profitSourceSelect').value,
    barberId,
    barberName: barber?.name || 'Servico da casa',
    amount: Number($('profitAmountInput').value || 0),
    commissionPercentage: Number($('profitCommissionInput').value || 0),
    paymentMethod: $('profitPaymentSelect').value,
    notes: $('profitNotesInput').value.trim(),
    createdAt: new Date().toISOString()
  };
}

export async function submitProfitForm(event) {
  event.preventDefault();
  const entry = buildProfitEntry();

  if (entry.amount <= 0) {
    setProfitStatus('Informe um valor recebido maior que zero.', 'error');
    return;
  }

  try {
    setProfitStatus('Registrando lancamento...');
    await api('/api/admin/profit-entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    });

    await reloadAdmin();
    setProfitStatus(entry.appointmentId
      ? 'Agendamento marcado como realizado e lucro atualizado.'
      : 'Lancamento manual salvo nesta tela.',
      'ok'
    );
  } catch (error) {
    setProfitStatus(error.message, 'error');
  }
}

export function clearProfitForm() {
  $('profitForm').reset();
  $('profitEntryDate').value = todayDate();
  $('profitFormStatus').textContent = '';
  $('profitFormStatus').className = 'status';
  syncProfitFormFromBarber();
  updateProfitPreview();
}
