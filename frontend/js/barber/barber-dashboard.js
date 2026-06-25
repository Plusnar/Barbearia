import { api } from '../api-client.js';
import { renderAppointments } from '../components/appointments-renderer.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money } from '../utils/format.js';

export async function loadBarber() {
  const appointments = await api('/api/appointments/barber');
  const completed = appointments.filter(item => item.status === 'COMPLETED');
  const pending = appointments.filter(item => ['PENDING', 'CONFIRMED'].includes(item.status));

  if (state.servicesCache.length === 0) {
    state.servicesCache = await api('/api/services');
  }

  const serviceMap = new Map(state.servicesCache.map(service => [service.id, service]));
  $('barberPendingMetric').textContent = pending.length;
  $('barberCompletedMetric').textContent = completed.length;
  $('barberRevenueMetric').textContent = money(completed.reduce((sum, item) => sum + Number(serviceMap.get(item.serviceId)?.price || 0), 0));
  renderAppointments($('barberAppointments'), appointments, { canUpdate: true, showCustomer: true });
}
