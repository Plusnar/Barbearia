import { api } from '../api-client.js';
import { renderAppointments } from '../components/appointments-renderer.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { loadDashboard } from './admin-navigation.js';

export function renderAdminAppointments() {
  const status = $('statusFilter').value;
  const filtered = status
    ? state.adminAppointmentsCache.filter(item => item.status === status)
    : state.adminAppointmentsCache;
  renderAppointments($('adminAppointments'), filtered, { canUpdate: true, showCustomer: true });
}

export async function updateStatus(id, status) {
  await api(`/api/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  await loadDashboard();
}
