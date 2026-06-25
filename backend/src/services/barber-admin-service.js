import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { beginTransaction, commitTransaction, rollbackTransaction } from '../db/transactions.js';
import { USER_ROLES } from '../utils/constants.js';
import {
  ensureScheduleTable,
  normalizeScheduleRows,
  queryAsync,
  weekdayLabels
} from '../utils/schedule.js';
import { validateEmail, validatePassword, validatePhone } from '../utils/validation.js';
import { normalizeCommission } from './profit-service.js';

const defaultCommission = 50;

const ensureCommissionTable = () => Promise.resolve();

const defaultSchedule = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 2, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '20:00' },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' }
];

const schedulePayload = (rows = []) => rows.map(row => ({
  dayOfWeek: Number(row.day_of_week),
  dayName: weekdayLabels[Number(row.day_of_week)],
  startTime: String(row.start_time).slice(0, 5),
  endTime: String(row.end_time).slice(0, 5)
}));

const insertScheduleRows = (connection, barberId, schedule) => {
  if (schedule.length === 0) return Promise.resolve();

  return queryAsync(
    connection,
    `INSERT INTO barber_working_hours (barber_id, day_of_week, start_time, end_time)
     VALUES ?
     ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)`,
    [schedule.map(row => [barberId, row.dayOfWeek, row.startTime, row.endTime])]
  );
};

export async function listBarbers() {
  await ensureCommissionTable();

  return new Promise((resolve, reject) => {
    db.query(
      `SELECT
        b.id,
        b.name,
        b.email,
        b.phone,
        b.specialization,
        b.available,
        COALESCE(bc.commission_percentage, ?) as commission_percentage,
        COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_appointments,
        COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN s.price ELSE 0 END), 0) as gross_revenue
      FROM users b
      LEFT JOIN barber_commissions bc ON bc.barber_id = b.id
      LEFT JOIN appointments a ON a.barber_id = b.id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE b.role = 'BARBER'
      GROUP BY b.id, b.name, b.email, b.phone, b.specialization, b.available, bc.commission_percentage
      ORDER BY b.name ASC`,
      [defaultCommission],
      (err, results) => {
        if (err) return reject(err);

        resolve(results.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          specialization: row.specialization,
          available: Boolean(row.available),
          commissionPercentage: normalizeCommission(row.commission_percentage),
          totalAppointments: Number(row.total_appointments || 0),
          completedAppointments: Number(row.completed_appointments || 0),
          grossRevenue: Number(row.gross_revenue || 0)
        })));
      }
    );
  });
}

export async function listBarberSchedules() {
  await ensureScheduleTable();
  const rows = await queryAsync(
    db,
    `SELECT wh.barber_id, wh.day_of_week, wh.start_time, wh.end_time
     FROM barber_working_hours wh
     JOIN users u ON u.id = wh.barber_id
     WHERE u.role = 'BARBER'
     ORDER BY wh.day_of_week ASC`
  );

  return rows.reduce((acc, row) => {
    acc[row.barber_id] = acc[row.barber_id] || [];
    acc[row.barber_id].push({
      dayOfWeek: Number(row.day_of_week),
      dayName: weekdayLabels[Number(row.day_of_week)],
      startTime: String(row.start_time).slice(0, 5),
      endTime: String(row.end_time).slice(0, 5)
    });
    return acc;
  }, {});
}

export async function getBarberSchedule(barberId) {
  await ensureScheduleTable();
  const barbers = await queryAsync(db, 'SELECT id FROM users WHERE id = ? AND role = ?', [barberId, USER_ROLES.BARBER]);

  if (barbers.length === 0) {
    const error = new Error('Barber not found');
    error.status = 404;
    throw error;
  }

  const rows = await queryAsync(
    db,
    'SELECT day_of_week, start_time, end_time FROM barber_working_hours WHERE barber_id = ? ORDER BY day_of_week ASC',
    [barberId]
  );

  return { barberId, schedule: schedulePayload(rows) };
}

export function updateBarberSchedule(barberId, scheduleInput) {
  const schedule = normalizeScheduleRows(scheduleInput);

  if (!Array.isArray(scheduleInput)) {
    const error = new Error('Schedule must be an array');
    error.status = 400;
    throw error;
  }

  if (schedule.length !== scheduleInput.length) {
    const error = new Error('Invalid day or time range in schedule');
    error.status = 400;
    throw error;
  }

  if (new Set(schedule.map(row => row.dayOfWeek)).size !== schedule.length) {
    const error = new Error('Each day can appear only once');
    error.status = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    db.getConnection(async (connectionError, connection) => {
      if (connectionError) return reject(connectionError);

      try {
        await ensureScheduleTable(connection);
        await beginTransaction(connection);

        const barbers = await queryAsync(connection, 'SELECT id FROM users WHERE id = ? AND role = ?', [barberId, USER_ROLES.BARBER]);
        if (barbers.length === 0) {
          await rollbackTransaction(connection);
          connection.release();
          const error = new Error('Barber not found');
          error.status = 404;
          throw error;
        }

        await queryAsync(connection, 'DELETE FROM barber_working_hours WHERE barber_id = ?', [barberId]);
        await insertScheduleRows(connection, barberId, schedule);
        await commitTransaction(connection);
        connection.release();
        resolve({ barberId, schedule });
      } catch (error) {
        await rollbackTransaction(connection);
        connection.release();
        reject(error);
      }
    });
  });
}

export function createBarber(body) {
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const password = body.password;
  const specialization = body.specialization?.trim() || 'Barbeiro';

  if (!name || !email || !phone || !password) {
    const error = new Error('Missing required fields');
    error.status = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error('Invalid email format');
    error.status = 400;
    throw error;
  }

  if (!validatePhone(phone)) {
    const error = new Error('Invalid phone number');
    error.status = 400;
    throw error;
  }

  if (!validatePassword(password)) {
    const error = new Error('Password must be at least 6 characters');
    error.status = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM users WHERE email = ?', [email], (selectError, users) => {
      if (selectError) return reject(selectError);

      if (users.length > 0) {
        const error = new Error('Email already exists');
        error.status = 400;
        reject(error);
        return;
      }

      const barberId = uuidv4();
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.query(
        'INSERT INTO users (id, name, email, phone, password, role, specialization, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [barberId, name, email, phone, hashedPassword, USER_ROLES.BARBER, specialization, 1],
        async (insertError) => {
          if (insertError) return reject(insertError);

          try {
            await ensureScheduleTable();
            await insertScheduleRows(db, barberId, defaultSchedule);

            resolve({
              id: barberId,
              name,
              email,
              phone,
              role: USER_ROLES.BARBER,
              specialization,
              available: true
            });
          } catch (scheduleError) {
            reject(scheduleError);
          }
        }
      );
    });
  });
}

export async function updateBarberCommission(barberId, commissionPercentage) {
  const commission = normalizeCommission(commissionPercentage);
  await ensureCommissionTable();

  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM users WHERE id = ? AND role = ?', [barberId, USER_ROLES.BARBER], (selectError, users) => {
      if (selectError) return reject(selectError);

      if (users.length === 0) {
        const error = new Error('Barber not found');
        error.status = 404;
        reject(error);
        return;
      }

      db.query(
        `INSERT INTO barber_commissions (barber_id, commission_percentage)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE commission_percentage = VALUES(commission_percentage)`,
        [barberId, commission],
        (upsertError) => {
          if (upsertError) return reject(upsertError);
          resolve({ barberId, commissionPercentage: commission });
        }
      );
    });
  });
}

export function updateBarber(barberId, body) {
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const specialization = body.specialization?.trim() || 'Barbeiro';

  if (!name || !email || !phone) {
    const error = new Error('Missing required fields');
    error.status = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error('Invalid email format');
    error.status = 400;
    throw error;
  }

  if (!validatePhone(phone)) {
    const error = new Error('Invalid phone number');
    error.status = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, barberId], (selectError, users) => {
      if (selectError) return reject(selectError);

      if (users.length > 0) {
        const error = new Error('Email already exists');
        error.status = 400;
        reject(error);
        return;
      }

      db.query(
        'UPDATE users SET name = ?, email = ?, phone = ?, specialization = ? WHERE id = ? AND role = ?',
        [name, email, phone, specialization, barberId, USER_ROLES.BARBER],
        (updateError) => {
          if (updateError) return reject(updateError);

          resolve({
            id: barberId,
            name,
            email,
            phone,
            specialization,
            role: USER_ROLES.BARBER
          });
        }
      );
    });
  });
}

export function deleteUser(userId) {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM users WHERE id = ? AND role != ?', [userId, USER_ROLES.ADMIN], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
