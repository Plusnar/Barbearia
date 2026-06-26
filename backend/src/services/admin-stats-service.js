import db from '../config/database.js';
import { APPOINTMENT_STATUS } from '../utils/constants.js';
import { splitAmount } from '../utils/money.js';
import { queryAsync } from '../utils/schedule.js';

const defaultCommission = 50;

export function getStatistics() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = ?) as completed_appointments,
        (
          SELECT COALESCE(SUM(pe.amount), 0) FROM profit_entries pe
        ) + (
          SELECT COALESCE(SUM(COALESCE(a.price_snapshot, s.price)), 0)
          FROM appointments a
          JOIN services s ON a.service_id = s.id
          WHERE a.status = ?
            AND NOT EXISTS (
              SELECT 1 FROM profit_entries pe2 WHERE pe2.appointment_id = a.id
            )
        ) as total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'BARBER' AND available = 1 AND deleted_at IS NULL) as active_barbers,
        (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') as total_customers,
        (SELECT COUNT(*) FROM appointments WHERE status = ?) as services_performed`,
      [
        APPOINTMENT_STATUS.COMPLETED,
        APPOINTMENT_STATUS.COMPLETED,
        APPOINTMENT_STATUS.COMPLETED
      ],
      (err, results) => {
        if (err) return reject(err);

        const stats = results[0];
        resolve({
          totalAppointments: stats.total_appointments || 0,
          completedAppointments: stats.completed_appointments || 0,
          totalRevenue: Number(stats.total_revenue || 0),
          activeBarbers: stats.active_barbers || 0,
          totalCustomers: stats.total_customers || 0,
          servicesPerformed: stats.services_performed || 0
        });
      }
    );
  });
}

export async function getProfitDistribution({ startDate = '', endDate = '', normalizeCommission }) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if ((startDate && !datePattern.test(startDate)) || (endDate && !datePattern.test(endDate))) {
    const error = new Error('Invalid date filter');
    error.status = 400;
    throw error;
  }

  if (startDate && endDate && startDate > endDate) {
    const error = new Error('Start date must be before end date');
    error.status = 400;
    throw error;
  }

  const barbers = await queryAsync(
    db,
    `SELECT
      b.id as barber_id,
      b.name as barber_name,
      b.email,
      b.phone,
      b.specialization,
      COALESCE(bc.commission_percentage, ?) as commission_percentage
    FROM users b
    LEFT JOIN barber_commissions bc ON bc.barber_id = b.id
    WHERE b.role = 'BARBER' AND b.deleted_at IS NULL
    ORDER BY b.name ASC`,
    [defaultCommission]
  );

  const entryFilters = [];
  const entryParams = [];
  if (startDate) {
    entryFilters.push('pe.entry_date >= ?');
    entryParams.push(startDate);
  }
  if (endDate) {
    entryFilters.push('pe.entry_date <= ?');
    entryParams.push(endDate);
  }
  const entryWhere = entryFilters.length ? `WHERE ${entryFilters.join(' AND ')}` : '';

  const apptFilters = [`a.status = '${APPOINTMENT_STATUS.COMPLETED}'`, 'NOT EXISTS (SELECT 1 FROM profit_entries pe2 WHERE pe2.appointment_id = a.id)'];
  const apptParams = [];
  if (startDate) {
    apptFilters.push('a.appointment_date >= ?');
    apptParams.push(startDate);
  }
  if (endDate) {
    apptFilters.push('a.appointment_date <= ?');
    apptParams.push(endDate);
  }

  const [profitEntries, orphanAppointments] = await Promise.all([
    queryAsync(
      db,
      `SELECT pe.barber_id, pe.amount, pe.commission_percentage
       FROM profit_entries pe
       ${entryWhere}`,
      entryParams
    ),
    queryAsync(
      db,
      `SELECT a.barber_id,
              COALESCE(a.price_snapshot, s.price) as amount,
              COALESCE(a.commission_snapshot, bc.commission_percentage, ?) as commission_percentage
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       LEFT JOIN barber_commissions bc ON bc.barber_id = a.barber_id
       WHERE ${apptFilters.join(' AND ')}`,
      [defaultCommission, ...apptParams]
    )
  ]);

  const barberMap = new Map(
    barbers.map((row) => [
      row.barber_id,
      {
        barberId: row.barber_id,
        barberName: row.barber_name,
        email: row.email,
        phone: row.phone,
        specialization: row.specialization,
        servicesPerformed: 0,
        grossRevenue: 0,
        barberShare: 0,
        houseShare: 0,
        commissionPercentage: normalizeCommission(row.commission_percentage)
      }
    ])
  );

  const addRevenueLine = (barberId, amount, commissionPct) => {
    const barber = barberMap.get(barberId);
    if (!barber) return;

    const split = splitAmount(amount, commissionPct);
    barber.servicesPerformed += 1;
    barber.grossRevenue = Number((barber.grossRevenue + split.gross).toFixed(2));
    barber.barberShare = Number((barber.barberShare + split.barber).toFixed(2));
    barber.houseShare = Number((barber.houseShare + split.house).toFixed(2));
  };

  profitEntries.forEach((row) => {
    if (!row.barber_id) return;
    addRevenueLine(row.barber_id, row.amount, normalizeCommission(row.commission_percentage));
  });

  orphanAppointments.forEach((row) => {
    addRevenueLine(row.barber_id, row.amount, normalizeCommission(row.commission_percentage));
  });

  const barberList = [...barberMap.values()]
    .sort((a, b) => b.grossRevenue - a.grossRevenue || a.barberName.localeCompare(b.barberName));

  return {
    totalGrossRevenue: Number(barberList.reduce((sum, item) => sum + item.grossRevenue, 0).toFixed(2)),
    totalBarberShare: Number(barberList.reduce((sum, item) => sum + item.barberShare, 0).toFixed(2)),
    totalHouseShare: Number(barberList.reduce((sum, item) => sum + item.houseShare, 0).toFixed(2)),
    barbers: barberList
  };
}

export function listAdminAppointments() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT a.id, a.customer_id, a.barber_id, a.service_id, c.name as customer_name, b.name as barber_name,
              s.name as service_name, COALESCE(a.price_snapshot, s.price) as price,
              a.appointment_date, a.appointment_time, a.status, a.created_at
       FROM appointments a
       JOIN users b ON a.barber_id = b.id
       JOIN users c ON a.customer_id = c.id
       JOIN services s ON a.service_id = s.id
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      (err, results) => {
        if (err) return reject(err);

        resolve(results.map(appointment => ({
          id: appointment.id,
          customerId: appointment.customer_id,
          barberId: appointment.barber_id,
          serviceId: appointment.service_id,
          customerName: appointment.customer_name,
          barberName: appointment.barber_name,
          serviceName: appointment.service_name,
          price: appointment.price,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          status: appointment.status,
          createdAt: appointment.created_at
        })));
      }
    );
  });
}
