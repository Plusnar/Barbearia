import db from '../config/database.js';
import { validateDate, validateTime } from './validation.js';

export const weekdayLabels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

export const queryAsync = (connection, sql, params = []) => new Promise((resolve, reject) => {
  connection.query(sql, params, (err, results) => {
    if (err) reject(err);
    else resolve(results);
  });
});

export const ensureScheduleTable = (connection = db) => queryAsync(
  connection,
  `CREATE TABLE IF NOT EXISTS barber_working_hours (
    barber_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (barber_id, day_of_week),
    INDEX idx_barber_working_hours_day (day_of_week),
    FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
  )`
);

export const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
};

export const dayOfWeekFromDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getDay();
};

export const normalizeScheduleRows = (rows = []) => rows
  .map(row => ({
    dayOfWeek: Number(row.day_of_week ?? row.dayOfWeek),
    startTime: String(row.start_time ?? row.startTime ?? '').slice(0, 5),
    endTime: String(row.end_time ?? row.endTime ?? '').slice(0, 5)
  }))
  .filter(row => (
    Number.isInteger(row.dayOfWeek) &&
    row.dayOfWeek >= 0 &&
    row.dayOfWeek <= 6 &&
    validateTime(row.startTime) &&
    validateTime(row.endTime) &&
    timeToMinutes(row.startTime) < timeToMinutes(row.endTime)
  ));

export const isInsideSchedule = (schedule, time, duration = 0) => {
  if (!schedule || !validateTime(time)) return false;
  const start = timeToMinutes(time);
  const end = start + Number(duration || 0);
  return start >= timeToMinutes(schedule.startTime) && end <= timeToMinutes(schedule.endTime);
};

export const generateTimesForSchedule = (schedule, duration = 0, step = 15) => {
  if (!schedule) return [];

  const times = [];
  const close = timeToMinutes(schedule.endTime);
  for (let current = timeToMinutes(schedule.startTime); current + Number(duration || 0) <= close; current += step) {
    times.push(minutesToTime(current));
  }

  return times;
};

export const hasOverlap = (appointment, time, duration) => {
  const start = timeToMinutes(time);
  const end = start + Number(duration || 0);
  const appointmentStart = timeToMinutes(appointment.appointment_time);
  const appointmentEnd = appointmentStart + Number(appointment.duration || 0);
  return appointmentStart < end && appointmentEnd > start;
};

export const getBarberSchedulesForDate = async (connection, date, barberId = null) => {
  if (!validateDate(date)) return [];
  const dayOfWeek = dayOfWeekFromDate(date);
  if (dayOfWeek === null) return [];

  const params = [dayOfWeek];
  const barberFilter = barberId ? 'AND u.id = ?' : '';
  if (barberId) params.push(barberId);

  const rows = await queryAsync(
    connection,
    `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.specialization,
      wh.day_of_week,
      wh.start_time,
      wh.end_time
    FROM users u
    JOIN barber_working_hours wh ON wh.barber_id = u.id
    WHERE u.role = 'BARBER'
      AND u.available = 1
      AND wh.day_of_week = ?
      ${barberFilter}
    ORDER BY u.name ASC`,
    params
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    specialization: row.specialization,
    schedule: {
      dayOfWeek: Number(row.day_of_week),
      startTime: String(row.start_time).slice(0, 5),
      endTime: String(row.end_time).slice(0, 5)
    }
  }));
};
