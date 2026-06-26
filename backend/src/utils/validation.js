export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const validateDate = (date) => {
  if (!datePattern.test(String(date))) return false;

  const [year, month, day] = String(date).split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.getFullYear() === year
    && dateObj.getMonth() === month - 1
    && dateObj.getDate() === day;
};

export const validateTime = (time) => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const getNowInTimezone = (timeZone = 'America/Sao_Paulo') => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute)
  };
};

export const isPastDateTime = (dateString, timeString = null, timeZone = 'America/Sao_Paulo') => {
  if (!validateDate(dateString)) return true;

  const now = getNowInTimezone(timeZone);

  if (dateString < now.date) return true;
  if (dateString > now.date) return false;
  if (!timeString || !validateTime(timeString)) return false;

  const [hours, minutes] = timeString.split(':').map(Number);
  const selectedMinutes = hours * 60 + minutes;

  return selectedMinutes < now.minutes;
};
