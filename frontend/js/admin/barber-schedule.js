import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { escapeHtml } from '../utils/html.js';
import { setStatus } from '../ui/status.js';

const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Segunda' },
  { dayOfWeek: 2, label: 'Terca' },
  { dayOfWeek: 3, label: 'Quarta' },
  { dayOfWeek: 4, label: 'Quinta' },
  { dayOfWeek: 5, label: 'Sexta' },
  { dayOfWeek: 6, label: 'Sabado' }
];

export const DEFAULT_BARBER_SCHEDULE = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 2, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' }
];

function renderScheduleFields(schedule = []) {
  const scheduleByDay = new Map(schedule.map((row) => [Number(row.dayOfWeek), row]));

  $('barberScheduleFields').innerHTML = WEEKDAYS.map((day) => {
    const row = scheduleByDay.get(day.dayOfWeek);
    const enabled = Boolean(row);
    const start = row?.startTime || '09:00';
    const end = row?.endTime || (day.dayOfWeek === 6 ? '17:00' : '20:00');

    return `
      <div class="commission-row schedule-row" data-day="${day.dayOfWeek}">
        <label class="schedule-day-toggle">
          <input type="checkbox" class="schedule-enabled" data-day="${day.dayOfWeek}" ${enabled ? 'checked' : ''} />
          <span>${escapeHtml(day.label)}</span>
        </label>
        <label>
          <span>Inicio</span>
          <input type="time" class="schedule-start" data-day="${day.dayOfWeek}" value="${escapeHtml(start)}" ${enabled ? '' : 'disabled'} />
        </label>
        <label>
          <span>Fim</span>
          <input type="time" class="schedule-end" data-day="${day.dayOfWeek}" value="${escapeHtml(end)}" ${enabled ? '' : 'disabled'} />
        </label>
      </div>
    `;
  }).join('');

  $('barberScheduleFields').querySelectorAll('.schedule-enabled').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const day = checkbox.dataset.day;
      const enabled = checkbox.checked;
      const root = $('barberScheduleFields');
      const start = root.querySelector(`.schedule-start[data-day="${day}"]`);
      const end = root.querySelector(`.schedule-end[data-day="${day}"]`);
      if (start) start.disabled = !enabled;
      if (end) end.disabled = !enabled;
    });
  });
}

export function readSchedulePayload() {
  const invalidDay = WEEKDAYS.find((day) => {
    const checkbox = document.querySelector(`.schedule-enabled[data-day="${day.dayOfWeek}"]`);
    if (!checkbox?.checked) return false;

    const start = document.querySelector(`.schedule-start[data-day="${day.dayOfWeek}"]`)?.value;
    const end = document.querySelector(`.schedule-end[data-day="${day.dayOfWeek}"]`)?.value;
    if (!start || !end) return false;

    return end <= start;
  });

  if (invalidDay) {
    throw new Error(`Horário inválido em ${invalidDay.label}: o fim deve ser depois do início.`);
  }

  return WEEKDAYS.map((day) => {
    const checkbox = document.querySelector(`.schedule-enabled[data-day="${day.dayOfWeek}"]`);
    if (!checkbox?.checked) return null;

    const start = document.querySelector(`.schedule-start[data-day="${day.dayOfWeek}"]`)?.value;
    const end = document.querySelector(`.schedule-end[data-day="${day.dayOfWeek}"]`)?.value;
    if (!start || !end) return null;

    return {
      dayOfWeek: day.dayOfWeek,
      startTime: start,
      endTime: end
    };
  }).filter(Boolean);
}

export function showBarberSchedulePanel(schedule = DEFAULT_BARBER_SCHEDULE) {
  $('barberScheduleHint')?.classList.add('hidden');
  $('barberSchedulePanel')?.classList.remove('hidden');
  renderScheduleFields(schedule);
  setStatus($('barberScheduleStatus'), 'Marque os dias e horários de atendimento deste profissional.', 'ok');
}

export function hideBarberSchedulePanel() {
  $('barberSchedulePanel')?.classList.add('hidden');
  $('barberScheduleFields').innerHTML = '';
  $('barberScheduleHint')?.classList.remove('hidden');
}

export async function loadBarberSchedule(barberId) {
  if (!barberId) {
    showBarberSchedulePanel();
    return;
  }

  $('barberScheduleHint')?.classList.add('hidden');
  $('barberSchedulePanel').classList.remove('hidden');
  setStatus($('barberScheduleStatus'), 'Carregando horários...');

  try {
    const data = await api(`/api/admin/barbers/${barberId}/schedule`);
    renderScheduleFields(data.schedule?.length ? data.schedule : DEFAULT_BARBER_SCHEDULE);
    setStatus($('barberScheduleStatus'), 'Ajuste o expediente e salve o barbeiro.', 'ok');
  } catch (error) {
    renderScheduleFields(DEFAULT_BARBER_SCHEDULE);
    setStatus($('barberScheduleStatus'), error.message, 'error');
  }
}

export async function persistBarberSchedule(barberId) {
  const schedule = readSchedulePayload();

  if (schedule.length === 0) {
    throw new Error('Marque pelo menos um dia de atendimento.');
  }

  await api(`/api/admin/barbers/${barberId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ schedule })
  });
}

export async function saveBarberSchedule() {
  const barberId = $('barberId').value;
  if (!barberId) {
    setStatus($('barberScheduleStatus'), 'Salve o barbeiro antes de gravar o expediente separadamente.', 'error');
    return;
  }

  try {
    setStatus($('barberScheduleStatus'), 'Salvando horários...');
    await persistBarberSchedule(barberId);
    setStatus($('barberScheduleStatus'), 'Horários salvos com sucesso.', 'ok');
  } catch (error) {
    setStatus($('barberScheduleStatus'), error.message, 'error');
  }
}

export function setupBarberSchedulePanel() {
  showBarberSchedulePanel();
}
