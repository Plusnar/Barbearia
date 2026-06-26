import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyDatabaseConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import serviceRoutes from './routes/services.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const frontendCandidates = [
  path.resolve(process.cwd(), 'frontend'),
  path.resolve(process.cwd(), '../frontend'),
  path.resolve(__dirname, '../../frontend')
];
const frontendPath = frontendCandidates.find((candidate) => fs.existsSync(candidate));

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const resolveCorsOrigin = () => {
  if (!isProduction) {
    return !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === 'true'
      ? true
      : process.env.CORS_ORIGIN;
  }

  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== 'true') {
    return process.env.CORS_ORIGIN;
  }

  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return true;
};

const corsOrigin = resolveCorsOrigin();
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

if (frontendPath) {
  app.use(express.static(frontendPath));
}

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

export default app;

if (process.env.VERCEL !== '1') {
  verifyDatabaseConnection()
    .then(() => {
      console.log('Database connected successfully');

      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
}
