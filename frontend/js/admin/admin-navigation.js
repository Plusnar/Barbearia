import { api } from '../api-client.js';
import { logout } from '../auth/session.js';
import { loadBarber } from '../barber/barber-dashboard.js';
import { loadCustomer } from '../customer/customer-data.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { setStatus } from '../ui/status.js';
import { loadAdmin } from './admin-data.js';

const MODULE_META = {
  account: {
    title: 'Minha conta',
    subtitle: 'Senha e segurança do acesso administrativo.'
  },
  profit: {
    title: 'Financeiro',
    subtitle: 'Lançamentos, divisão e comissões.'
  },
  barber: {
    title: 'Barbeiros',
    subtitle: 'Cadastro de profissionais e horários de atendimento (expediente).'
  },
  services: {
    title: 'Serviços',
    subtitle: 'Preços e duração usados nos agendamentos.'
  },
  agenda: {
    title: 'Agenda',
    subtitle: 'Todos os atendimentos da barbearia.'
  }
};

export function showAdminHub() {
  $('adminModuleHub')?.classList.remove('hidden');
  $('adminModuleToolbar')?.classList.add('hidden');
  $('adminModuleContent')?.classList.add('hidden');
  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.add('hidden');
  });
  $('pageTitle').textContent = 'Painel administrativo';
  $('pageSubtitle').textContent = 'Escolha um módulo para gerenciar a barbearia.';
}

export function openAdminModule(id) {
  const meta = MODULE_META[id];
  if (!meta) return;

  $('adminModuleHub')?.classList.add('hidden');
  $('adminModuleToolbar')?.classList.remove('hidden');
  $('adminModuleContent')?.classList.remove('hidden');
  $('adminModuleTitle').textContent = meta.title;
  $('pageTitle').textContent = meta.title;
  $('pageSubtitle').textContent = meta.subtitle;

  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.toggle('hidden', section.dataset.adminSection !== id);
  });
}

export function initAdminNavigation() {
  if (String(state.user?.role || '').toUpperCase() !== 'ADMIN') return;
  showAdminHub();
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
