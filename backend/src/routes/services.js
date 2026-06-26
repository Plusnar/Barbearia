import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { beginTransaction, commitTransaction, rollbackTransaction } from '../db/transactions.js';
import { adminMiddleware } from '../middleware/auth.js';
import { logAudit } from '../services/audit-service.js';
import { queryAsync } from '../utils/schedule.js';

const router = express.Router();

router.get('/', (req, res) => {
  db.query('SELECT * FROM services WHERE active = 1 ORDER BY price ASC', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const services = results.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price
    }));

    res.json(services);
  });
});

router.get('/barbers', (req, res) => {
  db.query(
    'SELECT id, name, email, phone, specialization FROM users WHERE role = ? AND available = 1 AND deleted_at IS NULL ORDER BY name ASC',
    ['BARBER'],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const barbers = results.map(barber => ({
        id: barber.id,
        name: barber.name,
        email: barber.email,
        phone: barber.phone,
        specialization: barber.specialization,
        available: true
      }));

      res.json(barbers);
    }
  );
});

router.post('/', adminMiddleware, (req, res) => {
  const { name, description, duration, price } = req.body;

  if (!name || !price || !duration) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const serviceId = uuidv4();

  db.query(
    'INSERT INTO services (id, name, description, duration, price) VALUES (?, ?, ?, ?, ?)',
    [serviceId, name, description || '', duration, price],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        service: { id: serviceId, name, description, duration, price }
      });
    }
  );
});

router.put('/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, description, duration, price } = req.body;

  if (!name || !price || !duration) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      await beginTransaction(connection);

      const existing = await queryAsync(connection, 'SELECT * FROM services WHERE id = ?', [id]);

      if (existing.length === 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const before = existing[0];

      await queryAsync(
        connection,
        'UPDATE services SET name = ?, description = ?, duration = ?, price = ? WHERE id = ?',
        [name, description || '', duration, price, id]
      );

      await logAudit(connection, {
        entity: 'service',
        entityId: id,
        action: 'update',
        actorId: req.userId,
        before: {
          name: before.name,
          description: before.description,
          duration: before.duration,
          price: Number(before.price)
        },
        after: {
          name,
          description: description || '',
          duration,
          price: Number(price)
        }
      });

      await commitTransaction(connection);
      connection.release();

      res.json({
        success: true,
        service: { id, name, description, duration, price }
      });
    } catch (error) {
      await rollbackTransaction(connection);
      connection.release();
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  });
});

router.delete('/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.getConnection(async (connectionError, connection) => {
    if (connectionError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    try {
      await beginTransaction(connection);

      const existing = await queryAsync(connection, 'SELECT * FROM services WHERE id = ?', [id]);

      if (existing.length === 0) {
        await rollbackTransaction(connection);
        connection.release();
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      await logAudit(connection, {
        entity: 'service',
        entityId: id,
        action: 'delete',
        actorId: req.userId,
        before: {
          name: existing[0].name,
          description: existing[0].description,
          duration: existing[0].duration,
          price: Number(existing[0].price)
        },
        after: null
      });

      await queryAsync(connection, 'DELETE FROM services WHERE id = ?', [id]);

      await commitTransaction(connection);
      connection.release();

      res.json({ success: true, message: 'Service deleted' });
    } catch (error) {
      await rollbackTransaction(connection);
      connection.release();
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  });
});

export default router;
