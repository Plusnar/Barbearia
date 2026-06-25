export function setStatus(target, message, type = '') {
  target.textContent = message || '';
  target.className = `status ${type}`.trim();
}
