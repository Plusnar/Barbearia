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
      (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') as total_customers,
      (SELECT COUNT(*) FROM appointments WHERE status = 'COMPLETED') as services_performed`,
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
        totalCustomers: stats.total_customers || 0,
        servicesPerformed: stats.services_performed || 0
      });
    }
  );
});

router.get('/profit-distribution', (req, res) => {
  const rawCommission = Number.parseInt(req.query.commission || '50', 10);
  const commissionPercentage = Number.isNaN(rawCommission)
    ? 50
    : Math.min(Math.max(rawCommission, 0), 100);
  const commissionRate = commissionPercentage / 100;

  db.query(
    `SELECT
      b.id as barber_id,
      b.name as barber_name,
      COUNT(a.id) as services_performed,
      COALESCE(SUM(s.price), 0) as gross_revenue
    FROM users b
    LEFT JOIN appointments a ON a.barber_id = b.id AND a.status = 'COMPLETED'
    LEFT JOIN services s ON a.service_id = s.id
    WHERE b.role = 'BARBER'
    GROUP BY b.id, b.name
    ORDER BY gross_revenue DESC, b.name ASC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const barbers = results.map(row => {
        const grossRevenue = Number(row.gross_revenue || 0);
        const barberShare = Number((grossRevenue * commissionRate).toFixed(2));
        const houseShare = Number((grossRevenue - barberShare).toFixed(2));

        return {
          barberId: row.barber_id,
          barberName: row.barber_name,
          servicesPerformed: Number(row.services_performed || 0),
          grossRevenue,
          barberShare,
          houseShare,
          commissionPercentage
        };
      });

      res.json({
        commissionPercentage,
        totalGrossRevenue: Number(barbers.reduce((sum, item) => sum + item.grossRevenue, 0).toFixed(2)),
        totalBarberShare: Number(barbers.reduce((sum, item) => sum + item.barberShare, 0).toFixed(2)),
        totalHouseShare: Number(barbers.reduce((sum, item) => sum + item.houseShare, 0).toFixed(2)),
        barbers
      });
    }
  );
});

router.get('/appointments', (req, res) => {
  db.query(
    'SELECT a.id, a.customer_id, a.barber_id, a.service_id, c.name as customer_name, b.name as barber_name, s.name as service_name, s.price, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN users c ON a.customer_id = c.id JOIN services s ON a.service_id = s.id ORDER BY a.appointment_date DESC, a.appointment_time DESC',
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
        price: appointment.price,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        createdAt: appointment.created_at
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
