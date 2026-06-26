import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { beginTransaction, commitTransaction, rollbackTransaction } from '../db/transactions.js';
import { ensureProfitEntryForAppointment } from '../services/profit-service.js';
import { ALLOWED_STATUS_TRANSITIONS, APPOINTMENT_STATUS } from '../utils/constants.js';
import { isPastDateTime, isValidUUID, validateDate, validateTime } from '../utils/validation.js';
import { sendAppointmentConfirmedNotification } from '../utils/notifications.js';
import {
  ensureScheduleTable,
  generateTimesForSchedule,
  getBarberSchedulesForDate,
  hasOverlap,
  isInsideSchedule,
  minutesToTime,
  queryAsync,
  timeToMinutes
} from '../utils/schedule.js';

const router = express.Router();

const ensureAppointmentLockTable = () => Promise.resolve();

const buildAppointmentLockKeys = ({ appointmentId, barberId, customerId, date, time, duration }) => {
  const start = timeToMinutes(time);
  const end = start + Number(duration || 0);
  const keys = [];

  for (let minute = start; minute < end; minute += 1) {
    const slot = minutesToTime(minute);
    keys.push([`barber:${barberId}:${date}:${slot}`, appointmentId]);
    keys.push([`customer:${customerId}:${date}:${slot}`, appointmentId]);
  }

  return keys;
};

const insertAppointmentLocks = (connection, locks) => {
  if (locks.length === 0) return Promise.resolve();

  return queryAsync(
    connection,
    'INSERT INTO appointment_slot_locks (lock_key, appointment_id) VALUES ?',
    [locks]
  );
};

const releaseAppointmentLocks = (connection, appointmentId) => queryAsync(
  connection,
  'DELETE FROM appointment_slot_locks WHERE appointment_id = ?',
  [appointmentId]
);

const getServiceDuration = async (connection, serviceId) => {
  if (!serviceId) return 0;

  const services = await queryAsync(
    connection,
    'SELECT duration FROM services WHERE id = ? AND active = 1',
    [serviceId]
  );

  return services.length ? Number(services[0].duration || 0) : null;
};

const getBookedAppointments = (connection, date) => queryAsync(
  connection,
  `SELECT a.barber_id, a.appointment_time, s.duration
   FROM appointments a
   JOIN services s ON a.service_id = s.id
   WHERE a.appointment_date = ? AND a.status IN (?, ?)`,
  [date, 'PENDING', 'CONFIRMED']
);

const buildAvailability = async (connection, { date, serviceId, barberId = null, time = null }) => {
  await ensureScheduleTable(connection);

  const duration = await getServiceDuration(connection, serviceId);
  if (duration === null) {
    const error = new Error('Service not found');
    error.status = 404;
    throw error;
  }

  const [barbers, appointments] = await Promise.all([
    getBarberSchedulesForDate(connection, date, barberId),
    getBookedAppointments(connection, date)
  ]);

  const availableBarbersFor = (slotTime) => barbers.filter(barber => (
    isInsideSchedule(barber.schedule, slotTime, duration) &&
    !appointments.some(appointment => appointment.barber_id === barber.id && hasOverlap(appointment, slotTime, duration))
  ));

  const times = [...new Set(barbers.flatMap(barber => generateTimesForSchedule(barber.schedule, duration)))]
    .sort()
    .filter(slotTime => availableBarbersFor(slotTime).length > 0);

  const selectedBarbers = time && validateTime(time) ? availableBarbersFor(time) : barbers;

  return {
    date,
    duration,
    times,
    barbers: selectedBarbers.map(barber => ({
      id: barber.id,
      name: barber.name,
      email: barber.email,
      phone: barber.phone,
      specialization: barber.specialization,
      schedule: barber.schedule
    })),
    slots: times.map(slotTime => ({
      date,
      time: slotTime,
      availableBarbers: availableBarbersFor(slotTime)
    }))
  };
};

router.get('/available-slots', (req, res) => {
  const { date, serviceId } = req.query;

  if (!date || !validateDate(date)) {
    return res.status(400).json({ success: false, message: 'Valid date required' });
  }

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      const availability = await buildAvailability(connection, { date, serviceId });
      connection.release();
      return res.json(availability.slots);
    } catch (error) {
      connection.release();
      return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Database error' });
    }
  });
});

router.get('/availability', (req, res) => {
  const { date, serviceId, barberId, time } = req.query;

  if (!date || !validateDate(date)) {
    return res.status(400).json({ success: false, message: 'Valid date required' });
  }

  if (!serviceId) {
    return res.status(400).json({ success: false, message: 'Service required' });
  }

  if (time && !validateTime(time)) {
    return res.status(400).json({ success: false, message: 'Valid time required' });
  }

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      const availability = await buildAvailability(connection, { date, serviceId, barberId, time });
      connection.release();
      return res.json(availability);
    } catch (error) {
      connection.release();
      return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Database error' });
    }
  });
});

router.post('/book', (req, res) => {
  const { barberId, serviceId, date, time, notes } = req.body;
  const customerId = req.userId;

  if (!barberId || !serviceId || !date || !time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!validateDate(date) || !validateTime(time) || isPastDateTime(date, time)) {
    return res.status(400).json({ success: false, message: 'Choose a valid future date and time' });
  }

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      await ensureAppointmentLockTable(connection);
      await beginTransaction(connection);

      const serviceRows = await queryAsync(
        connection,
        'SELECT id, name, duration, price FROM services WHERE id = ? AND active = 1',
        [serviceId]
      );

      if (serviceRows.length === 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const barberRows = await queryAsync(
        connection,
        'SELECT id FROM users WHERE id = ? AND role = ? AND available = 1 AND deleted_at IS NULL',
        [barberId, 'BARBER']
      );

      if (barberRows.length === 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(404).json({ success: false, message: 'Barber not found or unavailable' });
      }

      const duration = Number(serviceRows[0].duration || 0);

      if (!Number.isFinite(duration) || duration <= 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(400).json({ success: false, message: 'Invalid service duration' });
      }

      await ensureScheduleTable(connection);
      const scheduledBarbers = await getBarberSchedulesForDate(connection, date, barberId);
      const barberSchedule = scheduledBarbers[0]?.schedule;

      if (!isInsideSchedule(barberSchedule, time, duration)) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Este barbeiro nao atende nesse dia ou horario'
        });
      }

      const start = timeToMinutes(time);
      const end = start + duration;
      const existingAppointments = await queryAsync(
        connection,
        `SELECT a.id
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.appointment_date = ?
           AND a.status IN (?, ?)
           AND (a.barber_id = ? OR a.customer_id = ?)
           AND TIME_TO_SEC(a.appointment_time) < ?
           AND (TIME_TO_SEC(a.appointment_time) + (s.duration * 60)) > ?`,
        [date, 'PENDING', 'CONFIRMED', barberId, customerId, end * 60, start * 60]
      );

      if (existingAppointments.length > 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(409).json({ success: false, message: 'There is already an appointment registered for this time slot' });
      }

      const priceSnapshot = Number(serviceRows[0].price || 0);
      const appointmentId = uuidv4();

      await queryAsync(
        connection,
        `INSERT INTO appointments (
          id, customer_id, barber_id, service_id, appointment_date, appointment_time, status, notes, price_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appointmentId, customerId, barberId, serviceId, date, time, 'PENDING', notes || null, priceSnapshot]
      );

      await insertAppointmentLocks(
        connection,
        buildAppointmentLockKeys({ appointmentId, barberId, customerId, date, time, duration })
      );

      const results = await queryAsync(
        connection,
        'SELECT a.id, a.customer_id, a.barber_id, a.service_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.id = ?',
        [appointmentId]
      );

      await commitTransaction(connection);
      connection.release();

      const appointment = results[0];
      res.json({
        success: true,
        appointment: {
          id: appointment.id,
          customerId: appointment.customer_id,
          barberId: appointment.barber_id,
          serviceId: appointment.service_id,
          barberName: appointment.barber_name,
          serviceName: appointment.service_name,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          status: appointment.status,
          createdAt: appointment.created_at
        }
      });
    } catch (error) {
      await rollbackTransaction(connection);
      connection.release();

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'There is already an appointment registered for this time slot' });
      }

      console.error('Appointment booking failed:', error);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  });
});

router.get('/customer', (req, res) => {
  const customerId = req.userId;

  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, a.service_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.customer_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC',
    [customerId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const appointments = results.map(appointment => ({
        id: appointment.id,
        customerId: appointment.customer_id,
        barberId: appointment.barber_id,
        serviceId: appointment.service_id,
        barberName: appointment.barber_name,
        serviceName: appointment.service_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        createdAt: appointment.created_at
      }));

      res.json(appointments);
    }
  );
});

router.get('/barber', (req, res) => {
  const barberId = req.userId;

  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, a.service_id, c.name as customer_name, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN users c ON a.customer_id = c.id JOIN services s ON a.service_id = s.id WHERE a.barber_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC',
    [barberId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const appointments = results.map(appointment => ({
        id: appointment.id,
        customerId: appointment.customer_id,
        barberId: appointment.barber_id,
        serviceId: appointment.service_id,
        customerName: appointment.customer_name,
        barberName: appointment.barber_name,
        serviceName: appointment.service_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        createdAt: appointment.created_at
      }));

      res.json(appointments);
    }
  );
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['ADMIN', 'BARBER'].includes(req.userRole)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (!isValidUUID(id)) {
    return res.status(400).json({ success: false, message: 'Invalid appointment id' });
  }

  if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      await beginTransaction(connection);

      const selectSql = req.userRole === 'BARBER'
        ? 'SELECT id, status FROM appointments WHERE id = ? AND barber_id = ?'
        : 'SELECT id, status FROM appointments WHERE id = ?';
      const selectParams = req.userRole === 'BARBER' ? [id, req.userId] : [id];
      const currentRows = await queryAsync(connection, selectSql, selectParams);

      if (currentRows.length === 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(404).json({ success: false, message: 'Appointment not found for this user' });
      }

      const currentStatus = currentRows[0].status;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(status)) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${status}`
        });
      }

      const updateSql = req.userRole === 'BARBER'
        ? 'UPDATE appointments SET status = ? WHERE id = ? AND barber_id = ?'
        : 'UPDATE appointments SET status = ? WHERE id = ?';
      const updateParams = req.userRole === 'BARBER'
        ? [status, id, req.userId]
        : [status, id];

      await queryAsync(connection, updateSql, updateParams);

      if (status === APPOINTMENT_STATUS.COMPLETED) {
        await ensureProfitEntryForAppointment(connection, req.userId, id);
      }

      if ([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(status)) {
        await releaseAppointmentLocks(connection, id);
      }

      const results = await queryAsync(
        connection,
        `SELECT a.id, a.customer_id, a.barber_id, a.service_id, c.name as customer_name, c.email as customer_email,
                c.phone as customer_phone, b.name as barber_name, s.name as service_name, s.duration,
                a.appointment_date, a.appointment_time, a.status, a.created_at
         FROM appointments a
         JOIN users b ON a.barber_id = b.id
         JOIN users c ON a.customer_id = c.id
         JOIN services s ON a.service_id = s.id
         WHERE a.id = ?`,
        [id]
      );

      await commitTransaction(connection);
      connection.release();

      const appointment = results[0];

      if (status === APPOINTMENT_STATUS.CONFIRMED) {
        sendAppointmentConfirmedNotification(
          {
            name: appointment.customer_name,
            email: appointment.customer_email,
            phone: appointment.customer_phone
          },
          {
            id: appointment.id,
            serviceName: appointment.service_name,
            barberName: appointment.barber_name,
            date: String(appointment.appointment_date).slice(0, 10),
            time: String(appointment.appointment_time).slice(0, 5)
          }
        ).catch((notificationError) => {
          console.error('Appointment confirmation notification failed:', notificationError.message);
        });
      }

      res.json({
        id: appointment.id,
        customerId: appointment.customer_id,
        barberId: appointment.barber_id,
        serviceId: appointment.service_id,
        barberName: appointment.barber_name,
        serviceName: appointment.service_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        createdAt: appointment.created_at
      });
    } catch (error) {
      await rollbackTransaction(connection);
      connection.release();
      console.error('Appointment status update failed:', error);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  });
});

export default router;
