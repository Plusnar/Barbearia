import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import db from '../config/database.js';
import { validateEmail, validatePassword, validatePhone } from '../utils/validation.js';
import {
  sendAccountCreatedNotification,
  sendAccountRecoveryCodeNotification,
  sendPasswordChangedNotification
} from '../utils/notifications.js';

dotenv.config();

const router = express.Router();
const resetTokenExpirationMinutes = Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || 30);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateRecoveryCode = () => String(crypto.randomInt(100000, 1000000));

const sendGenericRecoveryResponse = (res) => {
  res.json({
    success: true,
    message: 'If the email is registered, recovery instructions will be sent.'
  });
};

const validateNotificationTestKey = (req, res) => {
  const configuredKey = process.env.NOTIFICATION_TEST_API_KEY;
  const requestKey = req.headers['x-notification-test-key'];

  if (!configuredKey || requestKey !== configuredKey) {
    res.status(403).json({ success: false, message: 'Notification test key required' });
    return false;
  }

  return true;
};

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
        const user = {
          id: userId,
          name,
          email,
          phone,
          role,
          createdAt: Date.now()
        };

        sendAccountCreatedNotification(user).catch((notificationError) => {
          console.error('Account created notification failed:', notificationError.message);
        });

        res.json({
          success: true,
          token,
          user
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

  db.query('SELECT id, name, email, phone FROM users WHERE email = ?', [email], (queryError, results) => {
    if (queryError) {
      console.error('forgot-password select failed:', queryError.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return sendGenericRecoveryResponse(res);
    }

    const user = results[0];
    const recoveryCode = generateRecoveryCode();
    const tokenHash = hashToken(recoveryCode);
    const tokenId = uuidv4();

    db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id], (deleteError) => {
      if (deleteError) {
        console.error('forgot-password delete token failed:', deleteError.message);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      db.query(
        'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
        [tokenId, user.id, tokenHash, resetTokenExpirationMinutes],
        (insertError) => {
          if (insertError) {
            console.error('forgot-password insert token failed:', insertError.message);
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          sendAccountRecoveryCodeNotification(user, recoveryCode, resetTokenExpirationMinutes).catch((notificationError) => {
            console.error('Account recovery notification failed:', notificationError.message);
          });

          sendGenericRecoveryResponse(res);
        }
      );
    });
  });
});

router.post('/reset-password', (req, res) => {
  const token = req.body.token?.trim() || req.body.code?.trim();
  const newPassword = req.body.newPassword;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const tokenHash = hashToken(token);

  db.query(
    `SELECT id, user_id
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
    (selectError, results) => {
      if (selectError) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      }

      const resetToken = results[0];
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetToken.user_id], (updateError) => {
        if (updateError) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [resetToken.id], (tokenUpdateError) => {
          if (tokenUpdateError) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          db.query('SELECT id, name, email, phone FROM users WHERE id = ?', [resetToken.user_id], (userError, userResults) => {
            if (!userError && userResults.length > 0) {
              sendPasswordChangedNotification(userResults[0]).catch((notificationError) => {
                console.error('Password changed notification failed:', notificationError.message);
              });
            }
          });

          res.json({ success: true, message: 'Password reset successfully' });
        });
      });
    }
  );
});

router.post('/notifications/test', (req, res) => {
  if (!validateNotificationTestKey(req, res)) return;

  const email = req.body.email?.trim().toLowerCase();
  const name = req.body.name?.trim() || 'Cliente';
  const phone = req.body.phone?.trim() || '';

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }

  sendAccountCreatedNotification({ name, email, phone })
    .then((result) => {
      res.json({ success: true, result });
    })
    .catch((error) => {
      res.status(502).json({ success: false, message: error.message });
    });
});

router.post('/notifications/recovery-test', (req, res) => {
  if (!validateNotificationTestKey(req, res)) return;

  const email = req.body.email?.trim().toLowerCase();
  const name = req.body.name?.trim() || 'Cliente';
  const phone = req.body.phone?.trim() || '';
  const recoveryCode = req.body.code?.trim() || '123456';

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }

  sendAccountRecoveryCodeNotification({ name, email, phone }, recoveryCode, resetTokenExpirationMinutes)
    .then((result) => {
      res.json({ success: true, result });
    })
    .catch((error) => {
      res.status(502).json({ success: false, message: error.message });
    });
});

export default router;
