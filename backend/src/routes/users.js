import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { validatePassword } from '../utils/validation.js';

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

router.put('/password', (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  db.query('SELECT password FROM users WHERE id = ?', [userId], (selectError, results) => {
    if (selectError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!bcrypt.compareSync(currentPassword, results[0].password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (updateError) => {
      if (updateError) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

export default router;
