import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { escapeHtml, inlineArg, singleQuotedArg } from '../utils/html.js';
import { setStatus } from '../ui/status.js';
import { loadAdmin } from './admin-data.js';
import {
  hideBarberSchedulePanel,
  loadBarberSchedule,
  persistBarberSchedule,
  readSchedulePayload,
  showBarberSchedulePanel
} from './barber-schedule.js';

export function renderBarbers(barbers) {
  barbers = barbers.map(barber => ({
    ...barber,
    id: singleQuotedArg(barber.id),
    name: escapeHtml(barber.name),
    email: escapeHtml(barber.email),
    specialization: escapeHtml(barber.specialization),
    phone: escapeHtml(barber.phone)
  }));

  $('barberList').innerHTML = barbers.length ? barbers.map(barber => `
    <article class="item">
      <div class="item-head">
        <strong>${barber.name}</strong>
        <span class="badge confirmed">${barber.email}</span>
      </div>
      <small>
        ${barber.specialization || 'Barbeiro'}<br>
        Telefone: ${barber.phone}
      </small>
      <div class="item-actions">
        <button class="ghost schedule-action" type="button" onclick="openBarberSchedule(${inlineArg(barber.id)})">Horários</button>
        <button class="ghost" type="button" onclick="editBarber(${inlineArg(barber.id)})">Editar</button>
        <button class="ghost danger-text" type="button" onclick="deleteBarber(${inlineArg(barber.id)})">Deletar</button>
      </div>
    </article>
  `).join('') : '<article class="empty">Nenhum barbeiro cadastrado.</article>';
}

export function prepareBarberModule() {
  if (!$('barberId')?.value) {
    showBarberSchedulePanel();
  }
}

export function editBarber(id) {
  const barber = state.barbersCache.find(item => item.id === id);
  if (!barber) return;
  $('barberId').value = barber.id;
  $('barberName').value = barber.name;
  $('barberEmail').value = barber.email;
  $('barberPhone').value = barber.phone;
  $('barberSpecialization').value = barber.specialization || '';
  $('barberPassword').value = '';
  $('barberName').focus();
  loadBarberSchedule(barber.id);
}

export async function openBarberSchedule(id) {
  const { openAdminModule } = await import('./admin-navigation.js');
  openAdminModule('barber');
  editBarber(id);
  $('barberSchedulePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function clearBarberForm() {
  $('barberForm').reset();
  $('barberId').value = '';
  showBarberSchedulePanel();
  setStatus($('barberStatus'), '');
  setStatus($('barberScheduleStatus'), '');
}

export async function deleteBarber(id) {
  if (!confirm('Tem certeza que deseja deletar este barbeiro? Todos os agendamentos serão perdidos.')) return;

  try {
    setStatus($('barberStatus'), 'Deletando barbeiro...');
    await api(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
    setStatus($('barberStatus'), 'Barbeiro deletado.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('barberStatus'), error.message, 'error');
  }
}

function readScheduleForSubmit() {
  try {
    return readSchedulePayload();
  } catch (error) {
    setStatus($('barberScheduleStatus'), error.message, 'error');
    return null;
  }
}

export async function submitBarberForm(event) {
  event.preventDefault();
  setStatus($('barberStatus'), 'Salvando barbeiro...');
  const id = $('barberId').value;
  const schedule = readScheduleForSubmit();
  if (!schedule) return;

  if (id && !$('barberPassword').value) {
    try {
      await api(`/api/admin/barbers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: $('barberName').value.trim(),
          email: $('barberEmail').value.trim(),
          phone: $('barberPhone').value.trim(),
          specialization: $('barberSpecialization').value.trim()
        })
      });
      await persistBarberSchedule(id);
      clearBarberForm();
      setStatus($('barberStatus'), 'Barbeiro e horários atualizados com sucesso.', 'ok');
      await loadAdmin();
    } catch (error) {
      setStatus($('barberStatus'), error.message, 'error');
    }
    return;
  }

  if (!$('barberPassword').value) {
    setStatus($('barberStatus'), 'Senha é obrigatória para novo barbeiro.', 'error');
    return;
  }

  try {
    await api('/api/admin/barbers', {
      method: 'POST',
      body: JSON.stringify({
        name: $('barberName').value.trim(),
        email: $('barberEmail').value.trim(),
        phone: $('barberPhone').value.trim(),
        specialization: $('barberSpecialization').value.trim(),
        password: $('barberPassword').value,
        schedule
      })
    });
    clearBarberForm();
    setStatus($('barberStatus'), 'Barbeiro cadastrado com horários de atendimento.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('barberStatus'), error.message, 'error');
  }
}
