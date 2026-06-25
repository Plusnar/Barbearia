import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { adminMiddleware } from '../middleware/auth.js';

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
    'SELECT id, name, email, phone, specialization FROM users WHERE role = ? AND available = 1 ORDER BY name ASC',
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

  db.query(
    'UPDATE services SET name = ?, description = ?, duration = ?, price = ? WHERE id = ?',
    [name, description || '', duration, price, id],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        service: { id, name, description, duration, price }
      });
    }
  );
});

router.delete('/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM services WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, message: 'Service deleted' });
  });
});

export default router;
