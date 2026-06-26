import { api } from '../api-client.js';
import { renderAppointments } from '../components/appointments-renderer.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money } from '../utils/format.js';
import { escapeHtml } from '../utils/html.js';
import { trackCustomerAppointmentNotifications } from './appointment-notifications.js';

function resetBookingSelects() {
  $('barberSelect').innerHTML = '<option value="">Selecione um horário</option>';
  $('barberSelect').disabled = true;
  $('timeSelect').innerHTML = '<option value="">Selecione serviço e data</option>';
  $('timeSelect').disabled = true;
}

export async function loadCustomer() {
  const [services, appointments] = await Promise.all([
    api('/api/services'),
    api('/api/appointments/customer')
  ]);

  state.servicesCache = services;
  $('serviceSelect').innerHTML = services.map(service =>
    `<option value="${escapeHtml(service.id)}">${escapeHtml(service.name)} - ${money(service.price)} - ${escapeHtml(service.duration)} min</option>`
  ).join('');
  $('dateInput').min = new Date().toISOString().slice(0, 10);
  if (!$('dateInput').value) $('dateInput').value = $('dateInput').min;
  resetBookingSelects();
  trackCustomerAppointmentNotifications(appointments);
  renderAppointments($('customerAppointments'), appointments, { showCustomer: false });
}

export function syncCustomerAutoRefresh(role) {
  if (state.customerRefreshTimer) {
    window.clearInterval(state.customerRefreshTimer);
    state.customerRefreshTimer = null;
  }

  if (role !== 'CUSTOMER') return;

  const refreshIfVisible = async () => {
    if (document.hidden) return;
    if (!state.token || String(state.user?.role || '').toUpperCase() !== 'CUSTOMER') return;

    try {
      await loadCustomer();
    } catch (error) {
      console.error('Customer refresh failed:', error.message);
    }
  };

  state.customerRefreshTimer = window.setInterval(refreshIfVisible, 15000);

  if (!state.customerVisibilityHandler) {
    state.customerVisibilityHandler = () => {
      if (!document.hidden) refreshIfVisible();
    };
    document.addEventListener('visibilitychange', state.customerVisibilityHandler);
  }
}
