import { appointmentStatusKey } from '../config.js';
import { shortDate } from '../utils/format.js';
import { showToast } from '../ui/toast.js';

export function readAppointmentStatuses() {
  try {
    return JSON.parse(localStorage.getItem(appointmentStatusKey)) || {};
  } catch {
    return {};
  }
}

export function saveAppointmentStatuses(statuses) {
  localStorage.setItem(appointmentStatusKey, JSON.stringify(statuses));
}

export function trackCustomerAppointmentNotifications(appointments) {
  const previousStatuses = readAppointmentStatuses();
  const nextStatuses = {};
  const hasPreviousHistory = Object.keys(previousStatuses).length > 0;

  appointments.forEach((appointment) => {
    nextStatuses[appointment.id] = appointment.status;

    if (
      hasPreviousHistory &&
      previousStatuses[appointment.id] &&
      previousStatuses[appointment.id] !== 'CONFIRMED' &&
      appointment.status === 'CONFIRMED'
    ) {
      const date = shortDate(appointment.date);
      const time = String(appointment.time || '').slice(0, 5);
      showToast(
        'Agendamento confirmado',
        `${appointment.serviceName || 'Seu corte'} foi confirmado para ${date} às ${time}.`
      );
    }
  });

  saveAppointmentStatuses(nextStatuses);
}
