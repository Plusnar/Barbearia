import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { escapeHtml } from '../utils/html.js';
import { setStatus } from '../ui/status.js';

function resetBarberSelect() {
  const barberSelect = $('barberSelect');
  if (!barberSelect) return;
  barberSelect.innerHTML = '<option value="">Selecione um horário</option>';
  barberSelect.disabled = true;
}

export async function refreshBookingTimes() {
  const date = $('dateInput')?.value;
  const serviceId = $('serviceSelect')?.value;
  const timeSelect = $('timeSelect');

  if (!timeSelect) return;

  resetBarberSelect();

  if (!date || !serviceId) {
    timeSelect.innerHTML = '<option value="">Selecione serviço e data</option>';
    timeSelect.disabled = true;
    setStatus($('bookingStatus'), '');
    return;
  }

  timeSelect.disabled = true;
  timeSelect.innerHTML = '<option value="">Carregando horários...</option>';
  setStatus($('bookingStatus'), 'Buscando horários disponíveis...');

  try {
    const params = new URLSearchParams({ date, serviceId });
    const availability = await api(`/api/appointments/availability?${params.toString()}`);
    const times = availability.times || [];

    if (times.length === 0) {
      timeSelect.innerHTML = '<option value="">Nenhum horário disponível</option>';
      timeSelect.disabled = true;
      setStatus($('bookingStatus'), 'Não há horários livres para esta data e serviço.', 'error');
      return;
    }

    timeSelect.innerHTML = [
      '<option value="">Selecione um horário</option>',
      ...times.map((time) => {
        const label = String(time).slice(0, 5);
        return `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`;
      })
    ].join('');
    timeSelect.disabled = false;
    setStatus($('bookingStatus'), `${times.length} horário(s) disponível(is).`, 'ok');
  } catch (error) {
    timeSelect.innerHTML = '<option value="">Erro ao carregar horários</option>';
    timeSelect.disabled = true;
    setStatus($('bookingStatus'), error.message, 'error');
  }
}

export async function refreshBookingBarbers() {
  const date = $('dateInput')?.value;
  const serviceId = $('serviceSelect')?.value;
  const time = $('timeSelect')?.value;
  const barberSelect = $('barberSelect');

  if (!barberSelect) return;

  if (!date || !serviceId || !time) {
    resetBarberSelect();
    return;
  }

  barberSelect.disabled = true;
  barberSelect.innerHTML = '<option value="">Carregando barbeiros...</option>';
  setStatus($('bookingStatus'), 'Buscando barbeiros disponíveis...');

  try {
    const params = new URLSearchParams({ date, serviceId, time });
    const availability = await api(`/api/appointments/availability?${params.toString()}`);
    const barbers = availability.barbers || [];

    if (barbers.length === 0) {
      barberSelect.innerHTML = '<option value="">Nenhum barbeiro disponível</option>';
      barberSelect.disabled = true;
      setStatus($('bookingStatus'), 'Nenhum barbeiro livre neste horário.', 'error');
      return;
    }

    barberSelect.innerHTML = barbers.map((barber) =>
      `<option value="${escapeHtml(barber.id)}">${escapeHtml(barber.name)} - ${escapeHtml(barber.specialization || 'Barbeiro')}</option>`
    ).join('');
    barberSelect.disabled = false;
    setStatus($('bookingStatus'), `${barbers.length} barbeiro(s) disponível(is).`, 'ok');
  } catch (error) {
    barberSelect.innerHTML = '<option value="">Erro ao carregar barbeiros</option>';
    barberSelect.disabled = true;
    setStatus($('bookingStatus'), error.message, 'error');
  }
}
