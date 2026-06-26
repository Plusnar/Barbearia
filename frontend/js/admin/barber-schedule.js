import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { setStatus } from '../ui/status.js';

const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Segunda', defaultEnd: '20:00' },
  { dayOfWeek: 2, label: 'Terca', defaultEnd: '20:00' },
  { dayOfWeek: 3, label: 'Quarta', defaultEnd: '20:00' },
  { dayOfWeek: 4, label: 'Quinta', defaultEnd: '20:00' },
  { dayOfWeek: 5, label: 'Sexta', defaultEnd: '20:00' },
  { dayOfWeek: 6, label: 'Sabado', defaultEnd: '17:00' }
];

export const DEFAULT_BARBER_SCHEDULE = WEEKDAYS.map((day) => ({
  dayOfWeek: day.dayOfWeek,
  startTime: '09:00',
  endTime: day.defaultEnd
}));

function getScheduleRoot() {
  return $('barberScheduleFields');
}

function setDayEnabled(dayOfWeek, enabled) {
  const start = document.querySelector(`.schedule-start[data-day="${dayOfWeek}"]`);
  const end = document.querySelector(`.schedule-end[data-day="${dayOfWeek}"]`);
  if (start) start.disabled = !enabled;
  if (end) end.disabled = !enabled;
}

export function applyScheduleToForm(schedule = DEFAULT_BARBER_SCHEDULE) {
  const scheduleByDay = new Map(schedule.map((row) => [Number(row.dayOfWeek), row]));

  WEEKDAYS.forEach((day) => {
    const row = scheduleByDay.get(day.dayOfWeek);
    const enabled = Boolean(row);
    const checkbox = document.querySelector(`.schedule-enabled[data-day="${day.dayOfWeek}"]`);
    const start = document.querySelector(`.schedule-start[data-day="${day.dayOfWeek}"]`);
    const end = document.querySelector(`.schedule-end[data-day="${day.dayOfWeek}"]`);

    if (checkbox) checkbox.checked = enabled;
    if (start) start.value = row?.startTime || '09:00';
    if (end) end.value = row?.endTime || day.defaultEnd;
    setDayEnabled(day.dayOfWeek, enabled);
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
    throw new Error(`Horario invalido em ${invalidDay.label}: o fim deve ser depois do inicio.`);
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
  $('barberSchedulePanel')?.classList.remove('hidden');
  applyScheduleToForm(schedule);
  setStatus($('barberScheduleStatus'), 'Marque os dias e horarios de atendimento deste barbeiro.', 'ok');
}

export async function loadBarberSchedule(barberId) {
  showBarberSchedulePanel();

  if (!barberId) return;

  setStatus($('barberScheduleStatus'), 'Carregando horarios...');

  try {
    const data = await api(`/api/admin/barbers/${barberId}/schedule`);
    applyScheduleToForm(data.schedule?.length ? data.schedule : DEFAULT_BARBER_SCHEDULE);
    setStatus($('barberScheduleStatus'), 'Horarios carregados. Ajuste e salve.', 'ok');
  } catch (error) {
    applyScheduleToForm(DEFAULT_BARBER_SCHEDULE);
    setStatus($('barberScheduleStatus'), `${error.message} Usando horario padrao.`, 'error');
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

  return schedule;
}

export async function saveBarberSchedule() {
  const barberId = $('barberId')?.value;
  if (!barberId) {
    setStatus($('barberScheduleStatus'), 'Selecione ou cadastre um barbeiro antes de salvar os horarios.', 'error');
    return;
  }

  try {
    setStatus($('barberScheduleStatus'), 'Salvando horarios...');
    await persistBarberSchedule(barberId);
    setStatus($('barberScheduleStatus'), 'Horarios salvos com sucesso.', 'ok');
  } catch (error) {
    setStatus($('barberScheduleStatus'), error.message, 'error');
  }
}

export function setupBarberSchedulePanel() {
  const root = getScheduleRoot();
  if (!root || root.dataset.bound === 'true') {
    applyScheduleToForm(DEFAULT_BARBER_SCHEDULE);
    return;
  }

  root.dataset.bound = 'true';
  root.querySelectorAll('.schedule-enabled').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      setDayEnabled(checkbox.dataset.day, checkbox.checked);
    });
  });

  applyScheduleToForm(DEFAULT_BARBER_SCHEDULE);
}
