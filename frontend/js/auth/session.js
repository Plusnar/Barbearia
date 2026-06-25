import { appointmentStatusKey, tokenKey, userKey } from '../config.js';
import { syncCustomerAutoRefresh } from '../customer/customer-data.js';
import { $ } from '../dom.js';
import { state } from '../state.js';

let loadDashboardFn = null;

export function setLoadDashboard(fn) {
  loadDashboardFn = fn;
}

export function readUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey));
  } catch {
    return null;
  }
}

function placeAccountPanel(role) {
  const accountPanel = $('accountPanel');
  const customerMount = $('accountPanelMount');
  const adminContent = $('adminModuleContent');

  if (!accountPanel) return;

  if (!state.accountOriginalParent) {
    state.accountOriginalParent = adminContent || accountPanel.parentNode;
  }

  if (role === 'ADMIN') {
    if (adminContent && accountPanel.parentNode !== adminContent) {
      adminContent.insertBefore(accountPanel, adminContent.firstChild);
    }
    return;
  }

  if (customerMount && accountPanel.parentNode !== customerMount) {
    customerMount.appendChild(accountPanel);
  }
  accountPanel.classList.remove('hidden');
  accountPanel.classList.add('account-panel');
}

export function renderSession() {
  const logged = Boolean(state.token && state.user);
  document.querySelector('.app-shell')?.classList.toggle('is-dashboard', logged);
  $('authScreen').classList.toggle('hidden', logged);
  $('dashboardScreen').classList.toggle('hidden', !logged);
  if (!logged) $('dashboardScreen').classList.remove('customer-dashboard');

  if (!logged) {
    syncCustomerAutoRefresh(null);
    return;
  }

  const role = String(state.user.role || 'CUSTOMER').toUpperCase();
  $('dashboardScreen').classList.toggle('customer-dashboard', role === 'CUSTOMER');
  $('sessionName').textContent = state.user.name || 'Usuário';
  $('sessionInfo').textContent = `${state.user.email || ''} | ${role}`;
  $('roleBadge').textContent = role === 'ADMIN' ? 'Administrador' : role === 'BARBER' ? 'Barbeiro' : 'Cliente';

  if (role === 'ADMIN') {
    $('pageTitle').textContent = 'Painel administrativo';
    $('pageSubtitle').textContent = 'Escolha um módulo para gerenciar a barbearia.';
  } else {
    $('pageTitle').textContent = role === 'BARBER' ? 'Agenda do barbeiro' : 'Agendar corte';
    $('pageSubtitle').textContent = role === 'BARBER'
      ? 'Confirme presença e marque cortes realizados.'
      : '';
  }

  $('customerView').classList.toggle('hidden', role !== 'CUSTOMER');
  $('barberView').classList.toggle('hidden', role !== 'BARBER');
  $('adminView').classList.toggle('hidden', role !== 'ADMIN');
  placeAccountPanel(role);
  if (role === 'ADMIN') {
    import('../admin/admin-navigation.js').then(({ initAdminNavigation }) => initAdminNavigation());
  }
  syncCustomerAutoRefresh(role);
  loadDashboardFn?.();
}

export function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  localStorage.removeItem(appointmentStatusKey);
  renderSession();
}
