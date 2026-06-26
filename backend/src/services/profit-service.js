import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { beginTransaction, commitTransaction, rollbackTransaction } from '../db/transactions.js';
import { APPOINTMENT_STATUS, USER_ROLES } from '../utils/constants.js';
import { normalizeMoney, splitAmount } from '../utils/money.js';
import { queryAsync } from '../utils/schedule.js';
import { logAudit } from './audit-service.js';

const defaultCommission = 50;
const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeCommission = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultCommission;
  return Math.min(Math.max(parsed, 0), 100);
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

const fetchAppointmentForProfit = (connection, appointmentId) => queryAsync(
  connection,
  `SELECT a.id, a.barber_id, a.status, a.appointment_date, a.price_snapshot,
          s.name as service_name, s.price,
          COALESCE(a.commission_snapshot, bc.commission_percentage, ?) as commission_percentage
   FROM appointments a
   JOIN services s ON s.id = a.service_id
   LEFT JOIN barber_commissions bc ON bc.barber_id = a.barber_id
   WHERE a.id = ?`,
  [defaultCommission, appointmentId]
);

const resolveExpectedAmount = (appointmentRow) => normalizeMoney(
  appointmentRow.price_snapshot ?? appointmentRow.price
);

export async function listProfitEntries() {
  const entries = await queryAsync(
    db,
    `${profitEntrySelect}
     ORDER BY pe.entry_date DESC, pe.created_at DESC`
  );
  return entries.map(profitEntryPayload);
}

export async function ensureProfitEntryForAppointment(connection, actorId, appointmentId, overrides = {}) {
  const existing = await queryAsync(
    connection,
    'SELECT id FROM profit_entries WHERE appointment_id = ?',
    [appointmentId]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const appointments = await fetchAppointmentForProfit(connection, appointmentId);

  if (appointments.length === 0) {
    return null;
  }

  const appointment = appointments[0];
  const amount = normalizeMoney(overrides.amount ?? resolveExpectedAmount(appointment));
  const commissionPercentage = normalizeCommission(
    overrides.commissionPercentage ?? appointment.commission_percentage
  );
  const source = overrides.source || appointment.service_name || 'Atendimento';
  const date = String(overrides.date || appointment.appointment_date).slice(0, 10);
  const paymentMethod = overrides.paymentMethod || null;
  const notes = overrides.notes || null;
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
      appointment.barber_id,
      source,
      date,
      amount,
      commissionPercentage,
      paymentMethod,
      notes,
      appointment.status,
      actorId
    ]
  );

  await queryAsync(
    connection,
    `UPDATE appointments
     SET commission_snapshot = COALESCE(commission_snapshot, ?),
         price_snapshot = COALESCE(price_snapshot, ?)
     WHERE id = ?`,
    [commissionPercentage, amount, appointmentId]
  );

  return entryId;
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
        await beginTransaction(connection);

        let previousStatus = null;
        let expectedAmount = null;

        if (appointmentId) {
          const appointments = await fetchAppointmentForProfit(connection, appointmentId);

          if (appointments.length === 0) {
            await rollbackTransaction(connection);
            connection.release();
            const error = new Error('Appointment not found');
            error.status = 404;
            throw error;
          }

          previousStatus = appointments[0].status;
          expectedAmount = resolveExpectedAmount(appointments[0]);

          if (expectedAmount !== amount) {
            await logAudit(connection, {
              entity: 'profit_entry',
              entityId: appointmentId,
              action: 'amount_divergence',
              actorId: userId,
              before: { expectedAmount },
              after: { amount, appointmentId, source }
            });
          }
        }

        if (barberId) {
          const barbers = await queryAsync(
            connection,
            'SELECT id FROM users WHERE id = ? AND role = ? AND deleted_at IS NULL',
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
            `UPDATE appointments
             SET status = ?,
                 commission_snapshot = COALESCE(commission_snapshot, ?),
                 price_snapshot = COALESCE(price_snapshot, ?)
             WHERE id = ?`,
            [APPOINTMENT_STATUS.COMPLETED, commissionPercentage, amount, appointmentId]
          );

          await queryAsync(
            connection,
            'DELETE FROM appointment_slot_locks WHERE appointment_id = ?',
            [appointmentId]
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

export function deleteProfitEntry(id, actorId) {
  return new Promise((resolve, reject) => {
    db.getConnection(async (connectionError, connection) => {
      if (connectionError) return reject(connectionError);

      try {
        await beginTransaction(connection);

        const entries = await queryAsync(
          connection,
          `${profitEntrySelect} WHERE pe.id = ?`,
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

        await logAudit(connection, {
          entity: 'profit_entry',
          entityId: id,
          action: 'delete',
          actorId,
          before: profitEntryPayload(entry),
          after: null
        });

        await queryAsync(connection, 'DELETE FROM profit_entries WHERE id = ?', [id]);

        if (entry.appointment_id && entry.previous_appointment_status) {
          const current = await queryAsync(
            connection,
            'SELECT status FROM appointments WHERE id = ?',
            [entry.appointment_id]
          );

          if (current.length > 0 && current[0].status === APPOINTMENT_STATUS.COMPLETED) {
            await queryAsync(
              connection,
              'UPDATE appointments SET status = ? WHERE id = ?',
              [entry.previous_appointment_status, entry.appointment_id]
            );
          }
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

export { splitAmount };
