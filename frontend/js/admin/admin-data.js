import { api } from '../api-client.js';
import { $ } from '../dom.js';
import { state } from '../state.js';
import { money } from '../utils/format.js';
import { renderBarbers } from './barbers-manager.js';
import { renderAdminAppointments } from './appointments-list.js';
import { renderServices } from './services-manager.js';

export async function loadAdmin() {
  const [stats, appointments, profit, profitEntries, services, barbers, schedulesByBarber] = await Promise.all([
    api('/api/admin/statistics'),
    api('/api/admin/appointments'),
    api('/api/admin/profit-distribution'),
    api('/api/admin/profit-entries'),
    api('/api/services'),
    api('/api/admin/barbers'),
    api('/api/admin/barber-schedules').catch(() => ({}))
  ]);

  state.servicesCache = services;
  state.barbersCache = barbers;
  state.barberSchedulesCache = schedulesByBarber;
  state.adminAppointmentsCache = appointments;
  state.profitEntriesCache = profitEntries;
  $('metricAppointments').textContent = stats.totalAppointments || 0;
  $('metricCompleted').textContent = stats.completedAppointments || 0;
  $('metricRevenue').textContent = money(stats.totalRevenue);
  $('metricCustomers').textContent = stats.totalCustomers || 0;

  const { hydrateProfitPanel } = await import('./profit-panel.js');
  hydrateProfitPanel(profit);
  renderServices(services);
  renderBarbers(barbers, schedulesByBarber);
  renderAdminAppointments();
}
