import { api } from '../api-client.js';
import { loadCustomer } from './customer-data.js';
import { refreshBookingBarbers, refreshBookingTimes } from './availability.js';
import { $ } from '../dom.js';
import { setStatus } from '../ui/status.js';

export async function submitBookingForm(event) {
  event.preventDefault();

  const serviceId = $('serviceSelect').value;
  const date = $('dateInput').value;
  const time = $('timeSelect').value;
  const barberId = $('barberSelect').value;

  if (!serviceId || !date) {
    setStatus($('bookingStatus'), 'Selecione serviço e data.', 'error');
    return;
  }

  if (!time) {
    setStatus($('bookingStatus'), 'Selecione um horário disponível.', 'error');
    return;
  }

  if (!barberId) {
    setStatus($('bookingStatus'), 'Selecione um barbeiro disponível.', 'error');
    return;
  }

  setStatus($('bookingStatus'), 'Salvando agendamento...');

  try {
    await api('/api/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        serviceId,
        barberId,
        date,
        time,
        notes: $('notesInput').value.trim()
      })
    });
    $('notesInput').value = '';
    setStatus($('bookingStatus'), 'Agendamento criado.', 'ok');
    await loadCustomer();
  } catch (error) {
    setStatus($('bookingStatus'), error.message, 'error');
    await refreshBookingTimes();
    if ($('timeSelect').value) await refreshBookingBarbers();
  }
}
