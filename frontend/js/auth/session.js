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
  const adminMount = $('adminAccountMount');

  if (!state.accountOriginalParent) {
    state.accountOriginalParent = accountPanel.parentNode;
    state.accountOriginalNext = accountPanel.nextSibling;
  }

  if (role === 'ADMIN') {
    adminMount.appendChild(accountPanel);
    accountPanel.classList.remove('account-panel');
    return;
  }

  if (accountPanel.parentNode !== state.accountOriginalParent) {
    state.accountOriginalParent.insertBefore(accountPanel, state.accountOriginalNext);
  }
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
  $('pageTitle').textContent = role === 'ADMIN' ? 'Painel administrativo' : role === 'BARBER' ? 'Agenda do barbeiro' : 'Agendar corte';
  $('pageSubtitle').textContent = role === 'ADMIN'
    ? 'Controle produção, comissões, serviços e agenda.'
    : role === 'BARBER'
      ? 'Confirme presença e marque cortes realizados.'
      : '';

  $('customerView').classList.toggle('hidden', role !== 'CUSTOMER');
  $('barberView').classList.toggle('hidden', role !== 'BARBER');
  $('adminView').classList.toggle('hidden', role !== 'ADMIN');
  placeAccountPanel(role);
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
