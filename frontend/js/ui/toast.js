import { $ } from '../dom.js';
import { escapeHtml } from '../utils/html.js';

export function showToast(title, message, type = 'ok') {
  const root = $('toastRoot');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`.trim();
  toast.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Fechar aviso">×</button>
  `;

  const close = () => {
    toast.classList.add('is-hiding');
    window.setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector('button').addEventListener('click', close);
  root.appendChild(toast);
  window.setTimeout(close, 6500);
}
