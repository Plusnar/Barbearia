import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/database.js';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import serviceRoutes from './routes/services.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);
app.use('/api/services', authMiddleware, serviceRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

db.getConnection((err, conn) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  conn.release();
  console.log('Database connected successfully');

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
