import { statusLabels } from '../config.js';
import { money, shortDate, statusClass } from '../utils/format.js';
import { escapeHtml, inlineArg, singleQuotedArg } from '../utils/html.js';

export function renderAppointments(target, appointments, options = {}) {
  appointments = appointments.map(appointment => ({
    ...appointment,
    id: singleQuotedArg(appointment.id),
    serviceName: escapeHtml(appointment.serviceName)
  }));

  target.innerHTML = appointments.length ? appointments.map(appointment => `
    <article class="item">
      <div class="item-head">
        <strong>${appointment.serviceName || 'Serviço'}</strong>
        <span class="badge ${escapeHtml(statusClass(appointment.status))}">${escapeHtml(statusLabels[appointment.status] || appointment.status)}</span>
      </div>
      <small>
        ${escapeHtml(shortDate(appointment.date))} às ${escapeHtml(String(appointment.time || '').slice(0, 5))}
        <br>Barbeiro: ${escapeHtml(appointment.barberName || '-')}
        ${options.showCustomer && appointment.customerName ? `<br>Cliente: ${escapeHtml(appointment.customerName)}` : ''}
        ${appointment.price ? `<br>Valor: ${money(appointment.price)}` : ''}
      </small>
      ${options.canUpdate ? `
        <div class="item-actions">
          <button class="ghost" onclick="updateStatus(${inlineArg(appointment.id)}, 'CONFIRMED')">Confirmar</button>
          <button class="ghost ok-text" onclick="updateStatus(${inlineArg(appointment.id)}, 'COMPLETED')">Realizado</button>
          <button class="ghost danger-text" onclick="updateStatus(${inlineArg(appointment.id)}, 'CANCELLED')">Não realizado</button>
        </div>
      ` : ''}
    </article>
  `).join('') : '<article class="empty">Nenhum agendamento encontrado.</article>';
}
