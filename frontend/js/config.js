export const API_BASE = location.hostname === 'localhost' && location.port && location.port !== '5000'
  ? 'http://localhost:5000'
  : '';

export const tokenKey = 'barbearia_token';
export const userKey = 'barbearia_user';
export const appointmentStatusKey = 'barbearia_appointment_statuses';

export const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Realizado',
  CANCELLED: 'Cancelado'
};
