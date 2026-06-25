import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { beginTransaction, commitTransaction, rollbackTransaction } from '../db/transactions.js';
import { APPOINTMENT_STATUS, USER_ROLES } from '../utils/constants.js';
import { queryAsync } from '../utils/schedule.js';

const defaultCommission = 50;
const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeCommission = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultCommission;
  return Math.min(Math.max(parsed, 0), 100);
};

export const normalizeMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

export const profitEntryPayload = (row) => ({
  id: row.id,
  appointmentId: row.appointment_id,
  barberId: row.barber_id || 'house',
  barberName: row.barber_name || 'Servico da casa',
  source: row.source,
  date: row.entry_date,
  amount: Number(row.amount || 0),
  commissionPercentage: normalizeCommission(row.commission_percentage),
  paymentMethod: row.payment_method || '-',
  notes: row.notes || '',
  previousAppointmentStatus: row.previous_appointment_status,
  createdAt: row.created_at
});

const ensureProfitEntriesTable = (connection = db) => queryAsync(
  connection,
  `CREATE TABLE IF NOT EXISTS profit_entries (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) UNIQUE,
    barber_id VARCHAR(36),
    source VARCHAR(120) NOT NULL,
    entry_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    previous_appointment_status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_profit_entries_date (entry_date),
    INDEX idx_profit_entries_barber_id (barber_id),
    INDEX idx_profit_entries_created_by (created_by),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`
);

const profitEntrySelect = `SELECT
  pe.id,
  pe.appointment_id,
  pe.barber_id,
  b.name as barber_name,
  pe.source,
  pe.entry_date,
  pe.amount,
  pe.commission_percentage,
  pe.payment_method,
  pe.notes,
  pe.previous_appointment_status,
  pe.created_at
FROM profit_entries pe
LEFT JOIN users b ON b.id = pe.barber_id`;

export async function listProfitEntries() {
  await ensureProfitEntriesTable();
  const entries = await queryAsync(
    db,
    `${profitEntrySelect}
     ORDER BY pe.entry_date DESC, pe.created_at DESC`
  );
  return entries.map(profitEntryPayload);
}

export function createProfitEntry(userId, body) {
  const appointmentId = body.appointmentId || null;
  const barberId = body.barberId === 'house' ? null : body.barberId;
  const source = String(body.source || '').trim();
  const date = String(body.date || '').slice(0, 10);
  const amount = normalizeMoney(body.amount);
  const commissionPercentage = normalizeCommission(body.commissionPercentage);
  const paymentMethod = String(body.paymentMethod || '').trim() || null;
  const notes = String(body.notes || '').trim() || null;

  if (!source || !validDatePattern.test(date) || amount <= 0) {
    const error = new Error('Invalid profit entry data');
    error.status = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    db.getConnection(async (connectionError, connection) => {
      if (connectionError) return reject(connectionError);

      try {
        await ensureProfitEntriesTable(connection);
        await beginTransaction(connection);

        let previousStatus = null;

        if (appointmentId) {
          const appointments = await queryAsync(
            connection,
            'SELECT id, status FROM appointments WHERE id = ?',
            [appointmentId]
          );

          if (appointments.length === 0) {
            await rollbackTransaction(connection);
            connection.release();
            const error = new Error('Appointment not found');
            error.status = 404;
            throw error;
          }

          previousStatus = appointments[0].status;
        }

        if (barberId) {
          const barbers = await queryAsync(
            connection,
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [barberId, USER_ROLES.BARBER]
          );

          if (barbers.length === 0) {
            await rollbackTransaction(connection);
            connection.release();
            const error = new Error('Barber not found');
            error.status = 404;
            throw error;
          }
        }

        const entryId = uuidv4();
        await queryAsync(
          connection,
          `INSERT INTO profit_entries (
            id, appointment_id, barber_id, source, entry_date, amount,
            commission_percentage, payment_method, notes, previous_appointment_status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entryId,
            appointmentId,
            barberId,
            source,
            date,
            amount,
            commissionPercentage,
            paymentMethod,
            notes,
            previousStatus,
            userId
          ]
        );

        if (appointmentId) {
          await queryAsync(
            connection,
            'UPDATE appointments SET status = ? WHERE id = ?',
            [APPOINTMENT_STATUS.COMPLETED, appointmentId]
          );
        }

        const entries = await queryAsync(
          connection,
          `${profitEntrySelect} WHERE pe.id = ?`,
          [entryId]
        );

        await commitTransaction(connection);
        connection.release();
        resolve(profitEntryPayload(entries[0]));
      } catch (error) {
        await rollbackTransaction(connection);
        connection.release();

        if (error.code === 'ER_DUP_ENTRY') {
          const dupError = new Error('This appointment already has a profit entry');
          dupError.status = 409;
          reject(dupError);
          return;
        }

        reject(error);
      }
    });
  });
}

export function deleteProfitEntry(id) {
  return new Promise((resolve, reject) => {
    db.getConnection(async (connectionError, connection) => {
      if (connectionError) return reject(connectionError);

      try {
        await ensureProfitEntriesTable(connection);
        await beginTransaction(connection);

        const entries = await queryAsync(
          connection,
          'SELECT id, appointment_id, previous_appointment_status FROM profit_entries WHERE id = ?',
          [id]
        );

        if (entries.length === 0) {
          await rollbackTransaction(connection);
          connection.release();
          const error = new Error('Profit entry not found');
          error.status = 404;
          throw error;
        }

        const entry = entries[0];
        await queryAsync(connection, 'DELETE FROM profit_entries WHERE id = ?', [id]);

        if (entry.appointment_id && entry.previous_appointment_status) {
          await queryAsync(
            connection,
            'UPDATE appointments SET status = ? WHERE id = ?',
            [entry.previous_appointment_status, entry.appointment_id]
          );
        }

        await commitTransaction(connection);
        connection.release();
        resolve();
      } catch (error) {
        await rollbackTransaction(connection);
        connection.release();
        reject(error);
      }
    });
  });
}
