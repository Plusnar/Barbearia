import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import db from '../config/database.js';
import { validateEmail, validatePassword, validatePhone } from '../utils/validation.js';

dotenv.config();

const router = express.Router();

router.post('/register', (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const phone = req.body.phone?.trim();
  const password = req.body.password;
  const role = 'CUSTOMER';

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

  db.query('SELECT id FROM users WHERE email = ?', [email], (selectError, results) => {
    if (selectError) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      'INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, phone, hashedPassword, role],
      (insertError) => {
        if (insertError) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
          success: true,
          token,
          user: {
            id: userId,
            name,
            email,
            phone,
            role,
            createdAt: Date.now()
          }
        });
      }
    );
  });
});

router.post('/login', (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (queryError, results) => {
    if (queryError) {
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

router.post('/forgot-password', (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }

  // Email delivery will be connected later. Keep the response generic to avoid account enumeration.
  res.json({
    success: true,
    message: 'If the email is registered, recovery instructions will be sent.'
  });
});

export default router;
