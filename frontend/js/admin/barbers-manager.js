import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { escapeHtml } from '../utils/html.js';
import { setStatus } from '../ui/status.js';
import { loadAdmin } from './admin-data.js';
import {
  DEFAULT_BARBER_SCHEDULE,
  loadBarberSchedule,
  persistBarberSchedule,
  readSchedulePayload,
  showBarberSchedulePanel
} from './barber-schedule.js';

function formatScheduleSummary(schedule = []) {
  if (!schedule.length) return 'Sem horario definido';

  const days = schedule
    .map((row) => Number(row.dayOfWeek))
    .sort((a, b) => a - b)
    .map((day) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][day])
    .join(', ');

  const first = schedule[0];
  const sameHours = schedule.every((row) => row.startTime === first.startTime && row.endTime === first.endTime);
  const hours = sameHours
    ? `${String(first.startTime).slice(0, 5)} - ${String(first.endTime).slice(0, 5)}`
    : 'horarios variados';

  return `${days} | ${hours}`;
}

export function renderBarbers(barbers, schedulesByBarber = {}) {
  $('barberList').innerHTML = barbers.length ? barbers.map((barber) => {
    const schedule = schedulesByBarber[barber.id] || [];
    const safeId = escapeHtml(barber.id);

    return `
      <article class="item">
        <div class="item-head">
          <strong>${escapeHtml(barber.name)}</strong>
          <span class="badge confirmed">${escapeHtml(barber.email)}</span>
        </div>
        <small>
          ${escapeHtml(barber.specialization || 'Barbeiro')}<br>
          Telefone: ${escapeHtml(barber.phone)}<br>
          <span class="barber-schedule-summary">${escapeHtml(formatScheduleSummary(schedule))}</span>
        </small>
        <div class="item-actions">
          <button class="ghost schedule-action" type="button" data-barber-action="schedule" data-barber-id="${safeId}">Horarios</button>
          <button class="ghost" type="button" data-barber-action="edit" data-barber-id="${safeId}">Editar</button>
          <button class="ghost danger-text" type="button" data-barber-action="delete" data-barber-id="${safeId}">Deletar</button>
        </div>
      </article>
    `;
  }).join('') : '<article class="empty">Nenhum barbeiro cadastrado.</article>';
}

export function prepareBarberModule() {
  $('barberFormTitle').textContent = 'Novo barbeiro';
  $('barberPasswordLabel').textContent = 'Senha inicial';
  showBarberSchedulePanel(DEFAULT_BARBER_SCHEDULE);
}

export function startNewBarberForm() {
  $('barberForm').reset();
  $('barberId').value = '';
  $('barberFormTitle').textContent = 'Novo barbeiro';
  $('barberPasswordLabel').textContent = 'Senha inicial';
  showBarberSchedulePanel(DEFAULT_BARBER_SCHEDULE);
  setStatus($('barberStatus'), '');
  setStatus($('barberScheduleStatus'), '');
  $('barberName')?.focus();
}

export function editBarber(id) {
  const barber = state.barbersCache.find((item) => item.id === id);
  if (!barber) return;

  $('barberId').value = barber.id;
  $('barberName').value = barber.name;
  $('barberEmail').value = barber.email;
  $('barberPhone').value = barber.phone;
  $('barberSpecialization').value = barber.specialization || '';
  $('barberPassword').value = '';
  $('barberFormTitle').textContent = `Editar: ${barber.name}`;
  $('barberPasswordLabel').textContent = 'Nova senha (opcional)';
  setStatus($('barberStatus'), '');
  showBarberSchedulePanel(DEFAULT_BARBER_SCHEDULE);
  loadBarberSchedule(barber.id);
  $('barberSchedulePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function openBarberSchedule(id) {
  const { openAdminModule } = await import('./admin-navigation.js');
  openAdminModule('barber');
  editBarber(id);
}

export function clearBarberForm() {
  startNewBarberForm();
}

export async function deleteBarber(id) {
  if (!confirm('Tem certeza que deseja deletar este barbeiro? Todos os agendamentos serao perdidos.')) return;

  try {
    setStatus($('barberStatus'), 'Deletando barbeiro...');
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    setStatus($('barberStatus'), 'Barbeiro deletado.', 'ok');
    startNewBarberForm();
    await loadAdmin();
  } catch (error) {
    setStatus($('barberStatus'), error.message, 'error');
  }
}

function readScheduleForSubmit() {
  try {
    return readSchedulePayload();
  } catch (error) {
    setStatus($('barberScheduleStatus'), error.message, 'error');
    return null;
  }
}

export async function submitBarberForm(event) {
  event.preventDefault();

  const id = $('barberId').value;
  const schedule = readScheduleForSubmit();
  if (!schedule) return;

  const payload = {
    name: $('barberName').value.trim(),
    email: $('barberEmail').value.trim(),
    phone: $('barberPhone').value.trim(),
    specialization: $('barberSpecialization').value.trim(),
    schedule
  };

  setStatus($('barberStatus'), 'Salvando barbeiro...');

  if (id) {
    try {
      await api(`/api/admin/barbers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      startNewBarberForm();
      setStatus($('barberStatus'), 'Barbeiro e horarios atualizados com sucesso.', 'ok');
      await loadAdmin();
    } catch (error) {
      setStatus($('barberStatus'), error.message, 'error');
    }
    return;
  }

  if (!$('barberPassword').value) {
    setStatus($('barberStatus'), 'Senha e obrigatoria para novo barbeiro.', 'error');
    return;
  }

  try {
    await api('/api/admin/barbers', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        password: $('barberPassword').value
      })
    });
    startNewBarberForm();
    setStatus($('barberStatus'), 'Barbeiro cadastrado com horarios de atendimento.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('barberStatus'), error.message, 'error');
  }
}

export function handleBarberListClick(event) {
  const button = event.target.closest('[data-barber-action]');
  if (!button) return;

  const id = button.dataset.barberId;
  const action = button.dataset.barberAction;

  if (action === 'edit') editBarber(id);
  if (action === 'schedule') openBarberSchedule(id);
  if (action === 'delete') deleteBarber(id);
}
