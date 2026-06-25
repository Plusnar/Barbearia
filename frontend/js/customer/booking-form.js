import { api } from '../api-client.js';
import { loadCustomer } from './customer-data.js';
import { $ } from '../dom.js';
import { setStatus } from '../ui/status.js';
import { getBusinessHours, getSelectedServiceDuration, minutesToTime, timeToMinutes } from '../utils/schedule.js';

export async function submitBookingForm(event) {
  event.preventDefault();
  setStatus($('bookingStatus'), 'Salvando agendamento...');
  const hours = getBusinessHours($('dateInput').value);
  const duration = getSelectedServiceDuration();
  const latestStart = hours ? minutesToTime(timeToMinutes(hours.end) - duration) : '';

  if (!hours) {
    setStatus($('bookingStatus'), 'A barbearia não atende aos domingos.', 'error');
    return;
  }

  if (duration > 0 && timeToMinutes(latestStart) < timeToMinutes(hours.start)) {
    setStatus($('bookingStatus'), 'O serviço selecionado não cabe no expediente deste dia.', 'error');
    return;
  }

  if ($('timeSelect').value < hours.start || $('timeSelect').value > latestStart) {
    setStatus($('bookingStatus'), `Escolha um horário entre ${hours.start} e ${latestStart}.`, 'error');
    return;
  }

  try {
    await api('/api/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: $('serviceSelect').value,
        barberId: $('barberSelect').value,
        date: $('dateInput').value,
        time: $('timeSelect').value,
        notes: $('notesInput').value.trim()
      })
    });
    $('notesInput').value = '';
    setStatus($('bookingStatus'), 'Agendamento criado.', 'ok');
    await loadCustomer();
  } catch (error) {
    setStatus($('bookingStatus'), error.message, 'error');
  }
}
