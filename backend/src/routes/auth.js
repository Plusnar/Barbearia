import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role || 'CUSTOMER';

    db.query(
      'INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, phone, hashedPassword, userRole],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const token = jwt.sign(
          { userId, role: userRole },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          token,
          user: { id: userId, name, email, phone, role: userRole, createdAt: Date.now() }
        });
      }
    );
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0 || !bcrypt.compareSync(password, results[0].password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = results[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });
  });
});

export default router;
