import express from 'express';
import db from '../config/database.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(adminMiddleware);

router.get('/statistics', (req, res) => {
  db.query(
    `SELECT 
      (SELECT COUNT(*) FROM appointments) as total_appointments,
      (SELECT COUNT(*) FROM appointments WHERE status = 'COMPLETED') as completed_appointments,
      (SELECT SUM(s.price) FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'COMPLETED') as total_revenue,
      (SELECT COUNT(*) FROM users WHERE role = 'BARBER' AND available = 1) as active_barbers,
      (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') as total_customers`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const stats = results[0];
      res.json({
        totalAppointments: stats.total_appointments || 0,
        completedAppointments: stats.completed_appointments || 0,
        totalRevenue: stats.total_revenue || 0,
        activeBarbers: stats.active_barbers || 0,
        totalCustomers: stats.total_customers || 0
      });
    }
  );
});

router.get('/appointments', (req, res) => {
  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, c.name as customer_name, b.name as barber_name, s.name as service_name, s.price, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN users c ON a.customer_id = c.id JOIN services s ON a.service_id = s.id ORDER BY a.appointment_date DESC',
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const appointments = results.map(a => ({
        id: a.id,
        customerId: a.customer_id,
        barberId: a.barber_id,
        serviceId: a.service_id,
        customerName: a.customer_name,
        barberName: a.barber_name,
        serviceName: a.service_name,
        price: a.price,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        createdAt: a.created_at
      }));

      res.json(appointments);
    }
  );
});

router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM users WHERE id = ? AND role != ?', [id, 'ADMIN'], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, message: 'User deleted' });
  });
});

export default router;
