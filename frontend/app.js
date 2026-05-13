const API_BASE = location.hostname === 'localhost' && location.port && location.port !== '5000'
  ? 'http://localhost:5000'
  : '';
const tokenKey = 'barbearia_token';
const userKey = 'barbearia_user';
const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Realizado',
  CANCELLED: 'Cancelado'
};

let token = localStorage.getItem(tokenKey);
let user = readUser();
let servicesCache = [];
let adminAppointmentsCache = [];

const $ = (id) => document.getElementById(id);

function startApp() {
  $('welcomeScreen').classList.add('is-hidden');
  window.setTimeout(() => {
    $('welcomeScreen').remove();
  }, 450);
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey));
  } catch {
    return null;
  }
}

function setStatus(target, message, type = '') {
  target.textContent = message || '';
  target.className = `status ${type}`.trim();
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function shortDate(value) {
  if (!value) return '-';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return day && month && year ? `${day}/${month}/${year}` : raw;
}

function statusClass(status) {
  return String(status || '').toLowerCase();
}

function getBusinessHours(dateString) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();

  if (day === 0) return null;
  if (day === 6) return { start: '09:00', end: '17:00', label: 'Sábado, das 09:00 às 17:00' };
  return { start: '09:00', end: '20:00', label: 'Segunda a sexta, das 09:00 às 20:00' };
}

function applyBusinessHours() {
  const date = $('dateInput').value;
  const hours = getBusinessHours(date);

  if (!hours) {
    $('timeSelect').value = '';
    $('timeSelect').min = '';
    $('timeSelect').max = '';
    $('timeSelect').disabled = true;
    setStatus($('bookingStatus'), 'A barbearia não atende aos domingos.', 'error');
    return;
  }

  $('timeSelect').disabled = false;
  $('timeSelect').min = hours.start;
  $('timeSelect').max = hours.end;

  if (!$('timeSelect').value || $('timeSelect').value < hours.start || $('timeSelect').value > hours.end) {
    $('timeSelect').value = hours.start;
  }

  setStatus($('bookingStatus'), 'Horário de atendimento: Segunda a sexta, das 09:00 às 20:00. Sábado, das 09:00 às 17:00.');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(body?.message || `Erro ${response.status}`);
  }
  return body;
}

function switchAuth(mode) {
  const login = mode === 'login';
  $('loginTab').classList.toggle('active', login);
  $('registerTab').classList.toggle('active', !login);
  $('loginForm').classList.toggle('hidden', !login);
  $('registerForm').classList.toggle('hidden', login);
  setStatus($('authStatus'), '');
}

function renderSession() {
  const logged = Boolean(token && user);
  $('authScreen').classList.toggle('hidden', logged);
  $('dashboardScreen').classList.toggle('hidden', !logged);
  if (!logged) $('dashboardScreen').classList.remove('customer-dashboard');

  if (!logged) return;

  const role = String(user.role || 'CUSTOMER').toUpperCase();
  $('dashboardScreen').classList.toggle('customer-dashboard', role === 'CUSTOMER');
  $('sessionName').textContent = user.name || 'Usuário';
  $('sessionInfo').textContent = `${user.email || ''} | ${role}`;
  $('roleBadge').textContent = role === 'ADMIN' ? 'Administrador' : role === 'BARBER' ? 'Barbeiro' : 'Cliente';
  $('pageTitle').textContent = role === 'ADMIN' ? 'Painel administrativo' : role === 'BARBER' ? 'Agenda do barbeiro' : 'Agendar corte';
  $('pageSubtitle').textContent = role === 'ADMIN'
    ? 'Controle produção, comissões, serviços e agenda.'
    : role === 'BARBER'
      ? 'Confirme presença e marque cortes realizados.'
      : '';

  $('customerView').classList.toggle('hidden', role !== 'CUSTOMER');
  $('barberView').classList.toggle('hidden', role !== 'BARBER');
  $('adminView').classList.toggle('hidden', role !== 'ADMIN');
  loadDashboard();
}

async function loadDashboard() {
  const role = String(user?.role || 'CUSTOMER').toUpperCase();
  try {
    if (role === 'CUSTOMER') await loadCustomer();
    if (role === 'BARBER') await loadBarber();
    if (role === 'ADMIN') await loadAdmin();
  } catch (error) {
    if (error.message.toLowerCase().includes('token')) logout();
    else setStatus($('authStatus'), error.message, 'error');
  }
}

async function loadCustomer() {
  const [services, barbers, appointments] = await Promise.all([
    api('/api/services'),
    api('/api/services/barbers'),
    api('/api/appointments/customer')
  ]);

  servicesCache = services;
  $('serviceSelect').innerHTML = services.map(service =>
    `<option value="${service.id}">${service.name} - ${money(service.price)} - ${service.duration} min</option>`
  ).join('');
  $('barberSelect').innerHTML = barbers.map(barber =>
    `<option value="${barber.id}">${barber.name} - ${barber.specialization || 'Barbeiro'}</option>`
  ).join('');
  $('dateInput').min = new Date().toISOString().slice(0, 10);
  if (!$('dateInput').value) $('dateInput').value = $('dateInput').min;
  applyBusinessHours();
  renderAppointments($('customerAppointments'), appointments, { showCustomer: false });
}

async function loadBarber() {
  const appointments = await api('/api/appointments/barber');
  const completed = appointments.filter(item => item.status === 'COMPLETED');
  const pending = appointments.filter(item => ['PENDING', 'CONFIRMED'].includes(item.status));

  if (servicesCache.length === 0) {
    servicesCache = await api('/api/services');
  }

  const serviceMap = new Map(servicesCache.map(service => [service.id, service]));
  $('barberPendingMetric').textContent = pending.length;
  $('barberCompletedMetric').textContent = completed.length;
  $('barberRevenueMetric').textContent = money(completed.reduce((sum, item) => sum + Number(serviceMap.get(item.serviceId)?.price || 0), 0));
  renderAppointments($('barberAppointments'), appointments, { canUpdate: true, showCustomer: true });
}

async function loadAdmin() {
  const [stats, appointments, profit, services] = await Promise.all([
    api('/api/admin/statistics'),
    api('/api/admin/appointments'),
    api('/api/admin/profit-distribution'),
    api('/api/services')
  ]);

  servicesCache = services;
  adminAppointmentsCache = appointments;
  $('metricAppointments').textContent = stats.totalAppointments || 0;
  $('metricCompleted').textContent = stats.completedAppointments || 0;
  $('metricRevenue').textContent = money(stats.totalRevenue);
  $('metricCustomers').textContent = stats.totalCustomers || 0;
  renderProfit(profit);
  renderServices(services);
  renderAdminAppointments();
}

function renderAppointments(target, appointments, options = {}) {
  target.innerHTML = appointments.length ? appointments.map(appointment => `
    <article class="item">
      <div class="item-head">
        <strong>${appointment.serviceName || 'Serviço'}</strong>
        <span class="badge ${statusClass(appointment.status)}">${statusLabels[appointment.status] || appointment.status}</span>
      </div>
      <small>
        ${shortDate(appointment.date)} às ${String(appointment.time || '').slice(0, 5)}
        <br>Barbeiro: ${appointment.barberName || '-'}
        ${options.showCustomer && appointment.customerName ? `<br>Cliente: ${appointment.customerName}` : ''}
        ${appointment.price ? `<br>Valor: ${money(appointment.price)}` : ''}
      </small>
      ${options.canUpdate ? `
        <div class="item-actions">
          <button class="ghost" onclick="updateStatus('${appointment.id}', 'CONFIRMED')">Confirmar</button>
          <button class="ghost ok-text" onclick="updateStatus('${appointment.id}', 'COMPLETED')">Realizado</button>
          <button class="ghost danger-text" onclick="updateStatus('${appointment.id}', 'CANCELLED')">Não realizado</button>
        </div>
      ` : ''}
    </article>
  `).join('') : '<article class="empty">Nenhum agendamento encontrado.</article>';
}

function renderProfit(data) {
  $('profitSummary').innerHTML = `
    <span>Bruto <strong>${money(data.totalGrossRevenue)}</strong></span>
    <span>Barbeiros <strong>${money(data.totalBarberShare)}</strong></span>
    <span>Casa <strong>${money(data.totalHouseShare)}</strong></span>
  `;

  $('profitList').innerHTML = data.barbers.length ? data.barbers.map(barber => `
    <article class="item">
      <div class="item-head">
        <strong>${barber.barberName}</strong>
        <span class="badge completed">${barber.servicesPerformed} cortes</span>
      </div>
      <small>
        Bruto: ${money(barber.grossRevenue)}<br>
        Barbeiro: ${money(barber.barberShare)} | Casa: ${money(barber.houseShare)}
      </small>
      <div class="commission-row">
        <label>
          <span>Comissão %</span>
          <input id="commission-${barber.barberId}" type="number" min="0" max="100" step="0.5" value="${barber.commissionPercentage}" />
        </label>
        <button class="ghost" onclick="saveCommission('${barber.barberId}')">Salvar</button>
      </div>
    </article>
  `).join('') : '<article class="empty">Nenhum barbeiro cadastrado.</article>';
}

function renderServices(services) {
  $('serviceList').innerHTML = services.length ? services.map(service => `
    <article class="item">
      <div class="item-head">
        <strong>${service.name}</strong>
        <span class="badge confirmed">${money(service.price)}</span>
      </div>
      <small>${service.description || 'Sem descrição'}<br>${service.duration} minutos</small>
      <div class="item-actions">
        <button class="ghost" onclick="editService('${service.id}')">Editar</button>
      </div>
    </article>
  `).join('') : '<article class="empty">Nenhum serviço cadastrado.</article>';
}

function renderAdminAppointments() {
  const status = $('statusFilter').value;
  const filtered = status
    ? adminAppointmentsCache.filter(item => item.status === status)
    : adminAppointmentsCache;
  renderAppointments($('adminAppointments'), filtered, { canUpdate: true, showCustomer: true });
}

async function updateStatus(id, status) {
  await api(`/api/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  await loadDashboard();
}

async function saveCommission(barberId) {
  const input = $(`commission-${barberId}`);
  await api(`/api/admin/barbers/${barberId}/commission`, {
    method: 'PUT',
    body: JSON.stringify({ commissionPercentage: input.value })
  });
  await loadAdmin();
}

function editService(id) {
  const service = servicesCache.find(item => item.id === id);
  if (!service) return;
  $('serviceId').value = service.id;
  $('serviceName').value = service.name;
  $('serviceDescription').value = service.description || '';
  $('serviceDuration').value = service.duration;
  $('servicePrice').value = service.price;
  $('serviceName').focus();
}

function clearServiceForm() {
  $('serviceForm').reset();
  $('serviceId').value = '';
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  renderSession();
}

$('loginTab').addEventListener('click', () => switchAuth('login'));
$('registerTab').addEventListener('click', () => switchAuth('register'));
$('welcomeScreen').addEventListener('click', startApp);
$('welcomeScreen').addEventListener('touchstart', startApp, { once: true });
$('refreshBtn').addEventListener('click', () => loadDashboard());
$('logoutBtn').addEventListener('click', logout);
$('statusFilter').addEventListener('change', renderAdminAppointments);
$('clearServiceBtn').addEventListener('click', clearServiceForm);
$('dateInput').addEventListener('change', applyBusinessHours);

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Entrando...');
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value
      })
    });
    token = data.token;
    user = data.user;
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
    renderSession();
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Criando conta...');
  try {
    await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('registerName').value.trim(),
        email: $('registerEmail').value.trim(),
        phone: $('registerPhone').value.trim(),
        password: $('registerPassword').value
      })
    });
    $('loginEmail').value = $('registerEmail').value.trim();
    $('loginPassword').value = '';
    $('registerForm').reset();
    switchAuth('login');
    setStatus($('authStatus'), 'Conta criada com sucesso. Entre com seu e-mail e senha.', 'ok');
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('passwordForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('passwordStatus'), 'Atualizando senha...');
  try {
    await api('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: $('currentPassword').value,
        newPassword: $('newPassword').value
      })
    });
    $('passwordForm').reset();
    setStatus($('passwordStatus'), 'Senha alterada com sucesso.', 'ok');
  } catch (error) {
    setStatus($('passwordStatus'), error.message, 'error');
  }
});

$('barberForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('barberStatus'), 'Criando barbeiro...');
  try {
    await api('/api/admin/barbers', {
      method: 'POST',
      body: JSON.stringify({
        name: $('barberName').value.trim(),
        email: $('barberEmail').value.trim(),
        phone: $('barberPhone').value.trim(),
        specialization: $('barberSpecialization').value.trim(),
        password: $('barberPassword').value
      })
    });
    $('barberForm').reset();
    setStatus($('barberStatus'), 'Barbeiro cadastrado com sucesso.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('barberStatus'), error.message, 'error');
  }
});

$('bookingForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('bookingStatus'), 'Salvando agendamento...');
  const hours = getBusinessHours($('dateInput').value);

  if (!hours) {
    setStatus($('bookingStatus'), 'A barbearia não atende aos domingos.', 'error');
    return;
  }

  if ($('timeSelect').value < hours.start || $('timeSelect').value > hours.end) {
    setStatus($('bookingStatus'), `Escolha um horário entre ${hours.start} e ${hours.end}.`, 'error');
    return;
  }

  try {
    await api('/api/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: $('serviceSelect').value,
        barberId: $('barberSelect').value,
        date: $('dateInput').value,
        time: $('timeSelect').value,
        notes: $('notesInput').value.trim()
      })
    });
    $('notesInput').value = '';
    setStatus($('bookingStatus'), 'Agendamento criado.', 'ok');
    await loadCustomer();
  } catch (error) {
    setStatus($('bookingStatus'), error.message, 'error');
  }
});

$('serviceForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('serviceStatus'), 'Salvando serviço...');
  const id = $('serviceId').value;
  const payload = {
    name: $('serviceName').value.trim(),
    description: $('serviceDescription').value.trim(),
    duration: Number($('serviceDuration').value),
    price: Number($('servicePrice').value)
  };

  try {
    await api(id ? `/api/services/${id}` : '/api/services', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    clearServiceForm();
    setStatus($('serviceStatus'), 'Serviço salvo.', 'ok');
    await loadAdmin();
  } catch (error) {
    setStatus($('serviceStatus'), error.message, 'error');
  }
});

window.updateStatus = updateStatus;
window.saveCommission = saveCommission;
window.editService = editService;

renderSession();
