import { $ } from '../dom.js';
import { setStatus } from '../ui/status.js';

export function switchAuth(mode) {
  const login = mode === 'login';
  const register = mode === 'register';
  const recovery = mode === 'recover';
  $('loginTab').classList.toggle('active', login);
  $('registerTab').classList.toggle('active', register);
  $('loginForm').classList.toggle('hidden', !login);
  $('registerForm').classList.toggle('hidden', !register);
  $('recoveryForm').classList.toggle('hidden', !recovery);
  $('resetPasswordForm').classList.toggle('hidden', !recovery);
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

export function startApp() {
  switchAuth('login');
  $('welcomeScreen').classList.add('is-hidden');
  window.setTimeout(() => {
    $('welcomeScreen').remove();
  }, 450);
}
