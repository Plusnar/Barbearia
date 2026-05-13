import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { isValidUUID, validateDate, validateTime } from '../utils/validation.js';

const router = express.Router();

const isPastDate = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(selectedDate.getTime()) || selectedDate < today;
};

const getBusinessHours = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();

  if (day === 0) return null;
  if (day === 6) return { start: '09:00', end: '17:00' };
  return { start: '09:00', end: '20:00' };
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

const isInsideBusinessHours = (date, time) => {
  if (!validateDate(date) || !validateTime(time)) return false;
  const hours = getBusinessHours(date);
  if (!hours) return false;

  const selected = timeToMinutes(time);
  return selected >= timeToMinutes(hours.start) && selected <= timeToMinutes(hours.end);
};

const generateSuggestedTimes = (date) => {
  const hours = getBusinessHours(date);
  if (!hours) return [];

  const times = [];
  for (let current = timeToMinutes(hours.start); current <= timeToMinutes(hours.end); current += 15) {
    const hour = String(Math.floor(current / 60)).padStart(2, '0');
    const minute = String(current % 60).padStart(2, '0');
    times.push(`${hour}:${minute}`);
  }

  return times;
};

router.get('/available-slots', (req, res) => {
  const { date } = req.query;

  if (!date || !validateDate(date)) {
    return res.status(400).json({ success: false, message: 'Valid date required' });
  }

  const times = generateSuggestedTimes(date);

  if (times.length === 0) {
    return res.json([]);
  }

  db.query('SELECT * FROM users WHERE role = ? AND available = 1', ['BARBER'], (barberError, barbers) => {
    if (barberError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    db.query(
      'SELECT barber_id, appointment_time FROM appointments WHERE appointment_date = ? AND status IN (?, ?)',
      [date, 'PENDING', 'CONFIRMED'],
      (appointmentsError, appointments) => {
        if (appointmentsError) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const occupied = new Set(
          appointments.map(item => `${item.barber_id}-${String(item.appointment_time).slice(0, 5)}`)
        );

        const slots = times.map(time => ({
          date,
          time,
          availableBarbers: barbers.filter(barber => !occupied.has(`${barber.id}-${time}`))
        }));

        res.json(slots);
      }
    );
  });
});

router.post('/book', (req, res) => {
  const { barberId, serviceId, date, time, notes } = req.body;
  const customerId = req.userId;

  if (!barberId || !serviceId || !date || !time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!validateDate(date) || !validateTime(time) || isPastDate(date)) {
    return res.status(400).json({ success: false, message: 'Choose a valid future date and time' });
  }

  if (!isInsideBusinessHours(date, time)) {
    return res.status(400).json({
      success: false,
      message: 'Business hours are Monday to Friday from 09:00 to 20:00 and Saturday from 09:00 to 17:00'
    });
  }

  db.query(
    'SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status IN (?, ?) AND (barber_id = ? OR customer_id = ?)',
    [date, time, 'PENDING', 'CONFIRMED', barberId, customerId],
    (checkError, existingAppointments) => {
      if (checkError) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (existingAppointments.length > 0) {
        return res.status(409).json({ success: false, message: 'There is already an appointment registered for this time slot' });
      }

      const appointmentId = uuidv4();

      db.query(
        'INSERT INTO appointments (id, customer_id, barber_id, service_id, appointment_date, appointment_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [appointmentId, customerId, barberId, serviceId, date, time, 'PENDING', notes || null],
        (insertError) => {
          if (insertError) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          db.query(
            'SELECT a.id, a.customer_id, a.barber_id, a.service_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.id = ?',
            [appointmentId],
            (appointmentError, results) => {
              if (appointmentError) {
                return res.status(500).json({ success: false, message: 'Database error' });
              }

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
            }
          );
        }
      );
    }
  );
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

  if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const params = req.userRole === 'BARBER'
    ? [status, id, req.userId]
    : [status, id];
  const updateSql = req.userRole === 'BARBER'
    ? 'UPDATE appointments SET status = ? WHERE id = ? AND barber_id = ?'
    : 'UPDATE appointments SET status = ? WHERE id = ?';

  db.query(updateSql, params, (updateError, result) => {
    if (updateError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found for this user' });
    }

    db.query(
      'SELECT a.id, a.customer_id, a.barber_id, a.service_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.id = ?',
      [id],
      (appointmentError, results) => {
        if (appointmentError) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const appointment = results[0];
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
      }
    );
  });
});

export default router;
