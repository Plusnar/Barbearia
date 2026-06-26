import { API_BASE } from './config.js';
import { state } from './state.js';

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      const message = text.replace(/\s+/g, ' ').trim().slice(0, 160);
      throw new Error(message || `Resposta invalida do servidor (${response.status})`);
    }
  }

  if (!response.ok) {
    throw new Error(body?.message || `Erro ${response.status}`);
  }
  return body;
}
