import { $ } from '../dom.js';
import { setStatus } from '../ui/status.js';

let appStarted = false;

export function isAppStarted() {
  return appStarted;
}

export function dismissWelcome() {
  const welcome = $('welcomeScreen');
  if (!welcome || welcome.classList.contains('is-hidden')) return;

  welcome.classList.add('is-hidden');
  window.setTimeout(() => {
    welcome.classList.add('hidden');
  }, 420);
}

export function showRecoveryStep(step) {
  $('recoveryForm')?.classList.toggle('hidden', step !== 1);
  $('resetPasswordForm')?.classList.toggle('hidden', step !== 2);
}

export function switchAuth(mode) {
  const login = mode === 'login';
  const register = mode === 'register';
  const recovery = mode === 'recover';
  $('loginTab').classList.toggle('active', login);
  $('registerTab').classList.toggle('active', register);
  $('loginForm').classList.toggle('hidden', !login);
  $('registerForm').classList.toggle('hidden', !register);

  if (recovery) {
    showRecoveryStep(1);
  } else {
    $('recoveryForm')?.classList.add('hidden');
    $('resetPasswordForm')?.classList.add('hidden');
  }

  setStatus($('authStatus'), '');
}

export function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.togglePassword);
      if (!input) return;

      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
      button.setAttribute('title', showing ? 'Mostrar senha' : 'Ocultar senha');
    });
  });
}

export function startApp(event) {
  event?.preventDefault();
  if (appStarted) return;

  appStarted = true;
  dismissWelcome();
  switchAuth('login');
  $('authScreen')?.classList.remove('hidden');
}
