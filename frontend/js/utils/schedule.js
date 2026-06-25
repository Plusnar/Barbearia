import { $ } from '../dom.js';
import { state } from '../state.js';
import { setStatus } from '../ui/status.js';

export function getBusinessHours(dateString) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();

  if (day === 0) return null;
  if (day === 6) return { start: '09:00', end: '17:00', label: 'Sábado, das 09:00 às 17:00' };
  return { start: '09:00', end: '20:00', label: 'Segunda a sexta, das 09:00 às 20:00' };
}

export function timeToMinutes(time) {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function getSelectedServiceDuration() {
  const service = state.servicesCache.find(item => item.id === $('serviceSelect')?.value);
  return Number(service?.duration || 0);
}

export function applyBusinessHours() {
  const date = $('dateInput').value;
  const hours = getBusinessHours(date);

  if (!hours) {
    $('timeSelect').value = '';
    $('timeSelect').min = '';
    $('timeSelect').max = '';
    $('timeSelect').disabled = true;
    setStatus($('bookingStatus'), 'A barbearia não atende aos domingos.', 'error');
    return;
  }

  const duration = getSelectedServiceDuration();
  const latestStart = minutesToTime(timeToMinutes(hours.end) - duration);

  $('timeSelect').disabled = false;
  $('timeSelect').min = hours.start;
  $('timeSelect').max = latestStart;

  if (duration > 0 && timeToMinutes(latestStart) < timeToMinutes(hours.start)) {
    $('timeSelect').value = '';
    $('timeSelect').disabled = true;
    setStatus($('bookingStatus'), 'O serviço selecionado não cabe no expediente deste dia.', 'error');
    return;
  }

  if (!$('timeSelect').value || $('timeSelect').value < hours.start || $('timeSelect').value > latestStart) {
    $('timeSelect').value = hours.start;
  }

  setStatus($('bookingStatus'), 'Horário de atendimento: Segunda a sexta, das 09:00 às 20:00. Sábado, das 09:00 às 17:00.');
}
