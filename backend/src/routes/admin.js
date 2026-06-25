import express from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import {
  getProfitDistribution,
  getStatistics,
  listAdminAppointments
} from '../services/admin-stats-service.js';
import {
  createBarber,
  deleteUser,
  getBarberSchedule,
  listBarberSchedules,
  listBarbers,
  updateBarber,
  updateBarberCommission,
  updateBarberSchedule
} from '../services/barber-admin-service.js';
import {
  createProfitEntry,
  deleteProfitEntry,
  listProfitEntries,
  normalizeCommission
} from '../services/profit-service.js';

const router = express.Router();

router.use(adminMiddleware);

const handleServiceError = (res, error, fallbackMessage = 'Database error') => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : fallbackMessage
  });
};

router.get('/statistics', async (req, res) => {
  try {
    const stats = await getStatistics();
    res.json(stats);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/profit-distribution', async (req, res) => {
  try {
    const profit = await getProfitDistribution({
      startDate: String(req.query.startDate || '').trim(),
      endDate: String(req.query.endDate || '').trim(),
      normalizeCommission
    });
    res.json(profit);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/profit-entries', async (req, res) => {
  try {
    const entries = await listProfitEntries();
    res.json(entries);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post('/profit-entries', async (req, res) => {
  try {
    const entry = await createProfitEntry(req.userId, req.body);
    res.json({ success: true, entry });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.delete('/profit-entries/:id', async (req, res) => {
  try {
    await deleteProfitEntry(req.params.id);
    res.json({ success: true });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/barbers', async (req, res) => {
  try {
    const barbers = await listBarbers();
    res.json(barbers);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/barber-schedules', async (req, res) => {
  try {
    const schedules = await listBarberSchedules();
    res.json(schedules);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/barbers/:id/schedule', async (req, res) => {
  try {
    const schedule = await getBarberSchedule(req.params.id);
    res.json(schedule);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.put('/barbers/:id/schedule', async (req, res) => {
  try {
    const result = await updateBarberSchedule(req.params.id, req.body.schedule);
    res.json({ success: true, ...result });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post('/barbers', async (req, res) => {
  try {
    const barber = await createBarber(req.body);
    res.json({ success: true, barber });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.put('/barbers/:id/commission', async (req, res) => {
  try {
    const result = await updateBarberCommission(req.params.id, req.body.commissionPercentage);
    res.json({ success: true, ...result });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const appointments = await listAdminAppointments();
    res.json(appointments);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.put('/barbers/:id', async (req, res) => {
  try {
    const barber = await updateBarber(req.params.id, req.body);
    res.json({ success: true, barber });
  } catch (error) {
    handleServiceError(res, error);
  }
});

export default router;
