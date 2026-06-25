export function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function shortDate(value) {
  if (!value) return '-';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return day && month && year ? `${day}/${month}/${year}` : raw;
}

export function statusClass(status) {
  return String(status || '').toLowerCase();
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
