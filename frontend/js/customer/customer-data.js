import { api } from '../api-client.js';
import { renderAppointments } from '../components/appointments-renderer.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money } from '../utils/format.js';
import { escapeHtml } from '../utils/html.js';
import { applyBusinessHours } from '../utils/schedule.js';
import { trackCustomerAppointmentNotifications } from './appointment-notifications.js';

export async function loadCustomer() {
  const [services, barbers, appointments] = await Promise.all([
    api('/api/services'),
    api('/api/services/barbers'),
    api('/api/appointments/customer')
  ]);

  state.servicesCache = services;
  $('serviceSelect').innerHTML = services.map(service =>
    `<option value="${escapeHtml(service.id)}">${escapeHtml(service.name)} - ${money(service.price)} - ${escapeHtml(service.duration)} min</option>`
  ).join('');
  $('barberSelect').innerHTML = barbers.map(barber =>
    `<option value="${escapeHtml(barber.id)}">${escapeHtml(barber.name)} - ${escapeHtml(barber.specialization || 'Barbeiro')}</option>`
  ).join('');
  $('dateInput').min = new Date().toISOString().slice(0, 10);
  if (!$('dateInput').value) $('dateInput').value = $('dateInput').min;
  applyBusinessHours();
  trackCustomerAppointmentNotifications(appointments);
  renderAppointments($('customerAppointments'), appointments, { showCustomer: false });
}

export function syncCustomerAutoRefresh(role) {
  if (state.customerRefreshTimer) {
    window.clearInterval(state.customerRefreshTimer);
    state.customerRefreshTimer = null;
  }

  if (role !== 'CUSTOMER') return;

  state.customerRefreshTimer = window.setInterval(async () => {
    if (!state.token || String(state.user?.role || '').toUpperCase() !== 'CUSTOMER') return;

    try {
      await loadCustomer();
    } catch (error) {
      console.error('Customer refresh failed:', error.message);
    }
  }, 15000);
}
