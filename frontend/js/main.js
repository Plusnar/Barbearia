import { api } from './api-client.js';
import { loadDashboard, openAdminModule, showAdminHub } from './admin/admin-navigation.js';
import { renderAdminAppointments, updateStatus } from './admin/appointments-list.js';
import {
  clearBarberForm,
  deleteBarber,
  editBarber,
  handleBarberListClick,
  openBarberSchedule,
  startNewBarberForm,
  submitBarberForm
} from './admin/barbers-manager.js';
import { saveBarberSchedule, setupBarberSchedulePanel } from './admin/barber-schedule.js';
import {
  clearProfitForm,
  deleteProfitEntry,
  renderProfitPanel,
  saveCommission,
  submitProfitForm,
  syncProfitFormFromAppointment,
  syncProfitFormFromBarber,
  syncProfitFormFromService,
  updateProfitPreview
} from './admin/profit-panel.js';
import {
  clearServiceForm,
  deleteService,
  editService,
  submitServiceForm
} from './admin/services-manager.js';
import { setupPasswordToggles, startApp, switchAuth } from './auth/auth-forms.js';
import { logout, renderSession, setLoadDashboard } from './auth/session.js';
import { submitBookingForm } from './customer/booking-form.js';
import { refreshBookingBarbers, refreshBookingTimes } from './customer/availability.js';
import { tokenKey, userKey } from './config.js';
import { $ } from './dom.js';
import { state } from './state.js';
import { setStatus } from './ui/status.js';
import { showToast } from './ui/toast.js';

const refreshBookingAvailability = () => {
  refreshBookingTimes().catch((error) => {
    console.error('Failed to refresh booking times:', error.message);
  });
};

setLoadDashboard(loadDashboard);

$('loginTab').addEventListener('click', () => switchAuth('login'));
$('registerTab').addEventListener('click', () => switchAuth('register'));
$('forgotPasswordBtn').addEventListener('click', () => {
  $('recoveryEmail').value = $('loginEmail').value.trim();
  switchAuth('recover');
});
$('backToLoginBtn').addEventListener('click', () => switchAuth('login'));
$('welcomeScreen').addEventListener('click', startApp);
$('welcomeScreen').addEventListener('touchstart', startApp, { once: true });
$('refreshBtn').addEventListener('click', () => loadDashboard());
$('logoutBtn').addEventListener('click', logout);
$('statusFilter').addEventListener('change', renderAdminAppointments);
$('profitEntryBarberSelect').addEventListener('change', syncProfitFormFromBarber);
$('profitAppointmentSelect').addEventListener('change', syncProfitFormFromAppointment);
$('profitSourceSelect').addEventListener('change', syncProfitFormFromService);
$('profitAmountInput').addEventListener('input', updateProfitPreview);
$('profitCommissionInput').addEventListener('input', updateProfitPreview);
$('profitApplyPeriodFilterBtn').addEventListener('click', renderProfitPanel);
$('profitClearPeriodFilterBtn').addEventListener('click', () => {
  $('profitPeriodStartDate').value = '';
  $('profitPeriodEndDate').value = '';
  renderProfitPanel();
});
$('profitClearButton').addEventListener('click', clearProfitForm);
$('clearServiceBtn').addEventListener('click', clearServiceForm);
$('clearBarberBtn').addEventListener('click', clearBarberForm);
$('newBarberBtn').addEventListener('click', startNewBarberForm);
$('barberList').addEventListener('click', handleBarberListClick);
$('saveBarberScheduleBtn').addEventListener('click', saveBarberSchedule);
$('dateInput').addEventListener('change', refreshBookingAvailability);
$('serviceSelect').addEventListener('change', refreshBookingAvailability);
$('timeSelect').addEventListener('change', () => {
  refreshBookingBarbers().catch((error) => {
    console.error('Failed to refresh booking barbers:', error.message);
  });
});
$('adminBackBtn').addEventListener('click', showAdminHub);
document.querySelectorAll('.admin-module-card').forEach((button) => {
  button.addEventListener('click', () => openAdminModule(button.dataset.adminModule));
});

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Entrando...');
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value
      })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem(tokenKey, state.token);
    localStorage.setItem(userKey, JSON.stringify(state.user));
    renderSession();
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Criando conta...');
  const password = $('registerPassword').value;
  const confirmPassword = $('registerConfirmPassword').value;

  if (password !== confirmPassword) {
    setStatus($('authStatus'), 'As senhas nao coincidem.', 'error');
    return;
  }

  try {
    await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('registerName').value.trim(),
        email: $('registerEmail').value.trim(),
        phone: $('registerPhone').value.trim(),
        password
      })
    });
    $('loginEmail').value = $('registerEmail').value.trim();
    $('loginPassword').value = '';
    $('registerForm').reset();
    switchAuth('login');
    setStatus($('authStatus'), 'Conta criada com sucesso. Entre com seu e-mail e senha.', 'ok');
    showToast('Conta criada', 'Agora entre com seu e-mail e senha para acessar.');
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('recoveryForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Preparando recuperacao...');
  try {
    await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: $('recoveryEmail').value.trim()
      })
    });
    setStatus($('authStatus'), 'Se o e-mail estiver cadastrado, o codigo de 6 digitos foi enviado.', 'ok');
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('resetPasswordForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Alterando senha...');
  try {
    await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        code: $('resetCode').value.trim(),
        newPassword: $('resetNewPassword').value
      })
    });
    $('recoveryForm').reset();
    $('resetPasswordForm').reset();
    switchAuth('login');
    setStatus($('authStatus'), 'Senha alterada com sucesso. Entre com sua nova senha.', 'ok');
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('passwordForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('passwordStatus'), 'Atualizando senha...');
  try {
    await api('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: $('currentPassword').value,
        newPassword: $('newPassword').value
      })
    });
    $('passwordForm').reset();
    setStatus($('passwordStatus'), 'Senha alterada com sucesso.', 'ok');
    showToast('Senha atualizada', 'Sua senha foi alterada com sucesso.');
  } catch (error) {
    setStatus($('passwordStatus'), error.message, 'error');
  }
});

$('profitForm').addEventListener('submit', submitProfitForm);
$('barberForm').addEventListener('submit', submitBarberForm);
$('bookingForm').addEventListener('submit', submitBookingForm);
$('serviceForm').addEventListener('submit', submitServiceForm);

window.updateStatus = updateStatus;
window.editService = editService;
window.deleteService = deleteService;
window.deleteProfitEntry = deleteProfitEntry;
window.saveCommission = saveCommission;

setupPasswordToggles();
setupBarberSchedulePanel();
renderSession();
