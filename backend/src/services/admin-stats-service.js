import db from '../config/database.js';
import { APPOINTMENT_STATUS } from '../utils/constants.js';

export function getStatistics() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = ?) as completed_appointments,
        (SELECT SUM(s.price) FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = ?) as total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'BARBER' AND available = 1) as active_barbers,
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
          totalRevenue: stats.total_revenue || 0,
          activeBarbers: stats.active_barbers || 0,
          totalCustomers: stats.total_customers || 0,
          servicesPerformed: stats.services_performed || 0
        });
      }
    );
  });
}

export function getProfitDistribution({ startDate = '', endDate = '', defaultCommission = 50, normalizeCommission }) {
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

  const dateFilters = [
    startDate ? 'a.appointment_date >= ?' : null,
    endDate ? 'a.appointment_date <= ?' : null
  ].filter(Boolean);
  const appointmentJoinFilters = [
    'a.barber_id = b.id',
    `a.status = '${APPOINTMENT_STATUS.COMPLETED}'`,
    ...dateFilters
  ].join(' AND ');
  const params = [defaultCommission];
  if (startDate) params.push(startDate);
  if (endDate) params.push(endDate);

  return new Promise((resolve, reject) => {
    db.query(
      `CREATE TABLE IF NOT EXISTS barber_commissions (
        barber_id VARCHAR(36) PRIMARY KEY,
        commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      (tableError) => {
        if (tableError) return reject(tableError);

        db.query(
          `SELECT
            b.id as barber_id,
            b.name as barber_name,
            b.email,
            b.phone,
            b.specialization,
            COALESCE(bc.commission_percentage, ?) as commission_percentage,
            COUNT(a.id) as services_performed,
            COALESCE(SUM(s.price), 0) as gross_revenue
          FROM users b
          LEFT JOIN barber_commissions bc ON bc.barber_id = b.id
          LEFT JOIN appointments a ON ${appointmentJoinFilters}
          LEFT JOIN services s ON a.service_id = s.id
          WHERE b.role = 'BARBER'
          GROUP BY b.id, b.name, b.email, b.phone, b.specialization, bc.commission_percentage
          ORDER BY gross_revenue DESC, b.name ASC`,
          params,
          (err, results) => {
            if (err) return reject(err);

            const barbers = results.map(row => {
              const grossRevenue = Number(row.gross_revenue || 0);
              const commissionPercentage = normalizeCommission(row.commission_percentage);
              const commissionRate = commissionPercentage / 100;
              const barberShare = Number((grossRevenue * commissionRate).toFixed(2));
              const houseShare = Number((grossRevenue - barberShare).toFixed(2));

              return {
                barberId: row.barber_id,
                barberName: row.barber_name,
                email: row.email,
                phone: row.phone,
                specialization: row.specialization,
                servicesPerformed: Number(row.services_performed || 0),
                grossRevenue,
                barberShare,
                houseShare,
                commissionPercentage
              };
            });

            resolve({
              totalGrossRevenue: Number(barbers.reduce((sum, item) => sum + item.grossRevenue, 0).toFixed(2)),
              totalBarberShare: Number(barbers.reduce((sum, item) => sum + item.barberShare, 0).toFixed(2)),
              totalHouseShare: Number(barbers.reduce((sum, item) => sum + item.houseShare, 0).toFixed(2)),
              barbers
            });
          }
        );
      }
    );
  });
}

export function listAdminAppointments() {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT a.id, a.customer_id, a.barber_id, a.service_id, c.name as customer_name, b.name as barber_name, s.name as service_name, s.price, a.appointment_date, a.appointment_time, a.status, a.created_at FROM appointments a JOIN users b ON a.barber_id = b.id JOIN users c ON a.customer_id = c.id JOIN services s ON a.service_id = s.id ORDER BY a.appointment_date DESC, a.appointment_time DESC',
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
