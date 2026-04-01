import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = express.Router();

router.get('/available-slots', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date required' });
  }

  const times = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  db.query('SELECT * FROM users WHERE role = ? AND available = 1', ['BARBER'], (err, barbers) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const slots = times.map(time => ({
      date,
      time,
      availableBarbers: barbers
    }));

    res.json(slots);
  });
});

router.post('/book', (req, res) => {
  const { barberId, serviceId, date, time } = req.body;
  const customerId = req.userId;

  if (!barberId || !serviceId || !date || !time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const appointmentId = uuidv4();

  db.query(
    'INSERT INTO appointments (id, customer_id, barber_id, service_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [appointmentId, customerId, barberId, serviceId, date, time, 'PENDING'],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      db.query(
        'SELECT a.id, a.customer_id, a.barber_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.id = ?',
        [appointmentId],
        (err, results) => {
          if (err) {
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
});

router.get('/customer', (req, res) => {
  const customerId = req.userId;

  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.customer_id = ? ORDER BY a.appointment_date DESC',
    [customerId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const appointments = results.map(a => ({
        id: a.id,
        customerId: a.customer_id,
        barberId: a.barber_id,
        serviceId: a.service_id,
        barberName: a.barber_name,
        serviceName: a.service_name,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        createdAt: a.created_at
      }));

      res.json(appointments);
    }
  );
});

router.get('/barber', (req, res) => {
  const barberId = req.userId;

  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, c.name as customer_name, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN users c ON a.customer_id = c.id JOIN services s ON a.service_id = s.id WHERE a.barber_id = ? ORDER BY a.appointment_date DESC',
    [barberId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const appointments = results.map(a => ({
        id: a.id,
        customerId: a.customer_id,
        barberId: a.barber_id,
        serviceId: a.service_id,
        barberName: a.barber_name,
        serviceName: a.service_name,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        createdAt: a.created_at
      }));

      res.json(appointments);
    }
  );
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    db.query(
      'SELECT a.id, a.customer_id, a.barber_id, b.name as barber_name, s.name as service_name, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN services s ON a.service_id = s.id WHERE a.id = ?',
      [id],
      (err, results) => {
        if (err) {
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
