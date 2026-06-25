import { api } from '../api-client.js';
import { logout } from '../auth/session.js';
import { loadBarber } from '../barber/barber-dashboard.js';
import { loadCustomer } from '../customer/customer-data.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { setStatus } from '../ui/status.js';
import { loadAdmin } from './admin-data.js';

export function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(button => {
    button.classList.toggle('active', button.dataset.adminTab === tab);
  });

  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.toggle('hidden', section.dataset.adminSection !== tab);
  });
}

export async function loadDashboard() {
  const role = String(state.user?.role || 'CUSTOMER').toUpperCase();
  try {
    if (role === 'CUSTOMER') await loadCustomer();
    if (role === 'BARBER') await loadBarber();
    if (role === 'ADMIN') await loadAdmin();
  } catch (error) {
    if (error.message.toLowerCase().includes('token')) logout();
    else setStatus($('authStatus'), error.message, 'error');
  }
}
