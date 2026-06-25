import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money } from '../utils/format.js';
import { escapeHtml, inlineArg, singleQuotedArg } from '../utils/html.js';
import { setStatus } from '../ui/status.js';
import { loadAdmin } from './admin-data.js';

export function renderServices(services) {
  services = services.map(service => ({
    ...service,
    id: singleQuotedArg(service.id),
    name: escapeHtml(service.name),
    description: escapeHtml(service.description),
    duration: escapeHtml(service.duration)
  }));

  $('serviceList').innerHTML = services.length ? services.map(service => `
    <article class="item">
      <div class="item-head">
        <strong>${service.name}</strong>
        <span class="badge confirmed">${money(service.price)}</span>
      </div>
      <small>${service.description || 'Sem descrição'}<br>${service.duration} minutos</small>
      <div class="item-actions">
        <button class="ghost" onclick="editService(${inlineArg(service.id)})">Editar</button>
        <button class="ghost danger-text" onclick="deleteService(${inlineArg(service.id)})">Deletar</button>
      </div>
    </article>
  `).join('') : '<article class="empty">Nenhum serviço cadastrado.</article>';
}

export function editService(id) {
  const service = state.servicesCache.find(item => item.id === id);
  if (!service) return;
  $('serviceId').value = service.id;
  $('serviceName').value = service.name;
  $('serviceDescription').value = service.description || '';
  $('serviceDuration').value = service.duration;
  $('servicePrice').value = service.price;
  $('serviceName').focus();
}

export function clearServiceForm() {
  $('serviceForm').reset();
  $('serviceId').value = '';
}

export async function deleteService(id) {
  if (!confirm('Tem certeza que deseja deletar este serviço?')) return;

  try {
    setStatus($('serviceStatus'), 'Deletando serviço...');
    await api(`/api/services/${id}`, {
      method: 'DELETE'
    });
    setStatus($('serviceStatus'), 'Serviço deletado.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('serviceStatus'), error.message, 'error');
  }
}

export async function submitServiceForm(event) {
  event.preventDefault();
  setStatus($('serviceStatus'), 'Salvando serviço...');
  const id = $('serviceId').value;
  const payload = {
    name: $('serviceName').value.trim(),
    description: $('serviceDescription').value.trim(),
    duration: Number($('serviceDuration').value),
    price: Number($('servicePrice').value)
  };

  try {
    await api(id ? `/api/services/${id}` : '/api/services', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    clearServiceForm();
    setStatus($('serviceStatus'), 'Serviço salvo.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('serviceStatus'), error.message, 'error');
  }
}
