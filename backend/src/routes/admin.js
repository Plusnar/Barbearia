import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { adminMiddleware } from '../middleware/auth.js';
import { validateEmail, validatePassword, validatePhone } from '../utils/validation.js';

const router = express.Router();

router.use(adminMiddleware);

const defaultCommission = 50;

const ensureCommissionTable = (callback) => {
  db.query(
    `CREATE TABLE IF NOT EXISTS barber_commissions (
      barber_id VARCHAR(36) PRIMARY KEY,
      commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    callback
  );
};

const normalizeCommission = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultCommission;
  return Math.min(Math.max(parsed, 0), 100);
};

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
  ensureCommissionTable((tableError) => {
    if (tableError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    db.query(
      `SELECT
        b.id as barber_id,
        b.name as barber_name,
        b.email,
        b.phone,
        b.specialization,
        COALESCE(bc.commission_percentage, ?) as commission_percentage,
        COUNT(a.id) as services_performed,
        COALESCE(SUM(s.price), 0) as gross_revenue
      FROM users b
      LEFT JOIN barber_commissions bc ON bc.barber_id = b.id
      LEFT JOIN appointments a ON a.barber_id = b.id AND a.status = 'COMPLETED'
      LEFT JOIN services s ON a.service_id = s.id
      WHERE b.role = 'BARBER'
      GROUP BY b.id, b.name, b.email, b.phone, b.specialization, bc.commission_percentage
      ORDER BY gross_revenue DESC, b.name ASC`,
      [defaultCommission],
      (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const barbers = results.map(row => {
        const grossRevenue = Number(row.gross_revenue || 0);
        const commissionPercentage = normalizeCommission(row.commission_percentage);
        const commissionRate = commissionPercentage / 100;
        const barberShare = Number((grossRevenue * commissionRate).toFixed(2));
        const houseShare = Number((grossRevenue - barberShare).toFixed(2));

        return {
          barberId: row.barber_id,
          barberName: row.barber_name,
          email: row.email,
          phone: row.phone,
          specialization: row.specialization,
          servicesPerformed: Number(row.services_performed || 0),
          grossRevenue,
          barberShare,
          houseShare,
          commissionPercentage
        };
      });

      res.json({
        totalGrossRevenue: Number(barbers.reduce((sum, item) => sum + item.grossRevenue, 0).toFixed(2)),
        totalBarberShare: Number(barbers.reduce((sum, item) => sum + item.barberShare, 0).toFixed(2)),
        totalHouseShare: Number(barbers.reduce((sum, item) => sum + item.houseShare, 0).toFixed(2)),
        barbers
      });
      }
    );
  });
});

router.get('/barbers', (req, res) => {
  ensureCommissionTable((tableError) => {
    if (tableError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

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
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json(results.map(row => ({
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
});

router.post('/barbers', (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const phone = req.body.phone?.trim();
  const password = req.body.password;
  const specialization = req.body.specialization?.trim() || 'Barbeiro';

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  db.query('SELECT id FROM users WHERE email = ?', [email], (selectError, users) => {
    if (selectError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (users.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const barberId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      'INSERT INTO users (id, name, email, phone, password, role, specialization, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [barberId, name, email, phone, hashedPassword, 'BARBER', specialization, 1],
      (insertError) => {
        if (insertError) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({
          success: true,
          barber: {
            id: barberId,
            name,
            email,
            phone,
            role: 'BARBER',
            specialization,
            available: true
          }
        });
      }
    );
  });
});

router.put('/barbers/:id/commission', (req, res) => {
  const { id } = req.params;
  const commission = normalizeCommission(req.body.commissionPercentage);

  ensureCommissionTable((tableError) => {
    if (tableError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    db.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'BARBER'], (selectError, users) => {
      if (selectError) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Barber not found' });
      }

      db.query(
        `INSERT INTO barber_commissions (barber_id, commission_percentage)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE commission_percentage = VALUES(commission_percentage)`,
        [id, commission],
        (upsertError) => {
          if (upsertError) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          res.json({ success: true, barberId: id, commissionPercentage: commission });
        }
      );
    });
  });
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
