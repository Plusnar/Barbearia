import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/profile', (req, res) => {
  const userId = req.userId;

  db.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = results[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at
    });
  });
});

export default router;
