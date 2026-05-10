const API_BASE = location.port === '5000' ? '' : 'http://localhost:5000';
const tokenKey = 'barbearia_token';
const userKey = 'barbearia_user';
const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

let token = localStorage.getItem(tokenKey);
let user = readUser();

const $ = (id) => document.getElementById(id);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey));
  } catch {
    return null;
  }
}

function setStatus(target, message, type = '') {
  target.textContent = message;
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
  const isLogin = mode === 'login';
  $('loginTab').classList.toggle('active', isLogin);
  $('registerTab').classList.toggle('active', !isLogin);
  $('loginForm').classList.toggle('hidden', !isLogin);
  $('registerForm').classList.toggle('hidden', isLogin);
  setStatus($('authStatus'), `API configurada: ${API_BASE || location.origin}`);
}

function renderSession() {
  const logged = Boolean(token && user);
  $('authPanel').classList.toggle('hidden', logged);
  $('sessionPanel').classList.toggle('hidden', !logged);
  $('guestState').classList.toggle('hidden', logged);
  $('appState').classList.toggle('hidden', !logged);
  $('connectionLabel').textContent = logged ? 'Banco online conectado' : 'Aguardando login';

  if (!logged) return;

  $('sessionName').textContent = user.name || 'Usuário';
  $('sessionInfo').textContent = `${user.email || ''} • ${user.role || 'CUSTOMER'}`;
  renderRoleViews();
  loadDashboard();
}

function renderRoleViews() {
  const role = String(user?.role || 'CUSTOMER').toUpperCase();
  $('customerView').classList.toggle('hidden', role !== 'CUSTOMER');
  $('barberView').classList.toggle('hidden', role !== 'BARBER');
  $('adminView').classList.toggle('hidden', role !== 'ADMIN');
}

async function loadDashboard() {
  const role = String(user?.role || 'CUSTOMER').toUpperCase();
  if (role === 'CUSTOMER') await loadCustomer();
  if (role === 'BARBER') await loadBarber();
  if (role === 'ADMIN') await loadAdmin();
}

async function loadCustomer() {
  const [services, barbers, appointments] = await Promise.all([
    api('/api/services'),
    api('/api/services/barbers'),
    api('/api/appointments/customer')
  ]);

  $('serviceSelect').innerHTML = services.map((service) =>
    `<option value="${service.id}">${service.name} • ${money(service.price)} • ${service.duration} min</option>`
  ).join('');
  $('barberSelect').innerHTML = barbers.map((barber) =>
    `<option value="${barber.id}">${barber.name} • ${barber.specialization || 'Barbeiro'}</option>`
  ).join('');
  $('timeSelect').innerHTML = times.map((time) => `<option value="${time}">${time}</option>`).join('');
  $('dateInput').min = new Date().toISOString().slice(0, 10);
  if (!$('dateInput').value) $('dateInput').value = $('dateInput').min;
  renderAppointments($('customerAppointments'), appointments);
}

async function loadBarber() {
  const appointments = await api('/api/appointments/barber');
  renderAppointments($('barberAppointments'), appointments, true);
}

async function loadAdmin() {
  const [stats, appointments] = await Promise.all([
    api('/api/admin/statistics'),
    api('/api/admin/appointments')
  ]);
  $('metricAppointments').textContent = stats.totalAppointments || 0;
  $('metricRevenue').textContent = money(stats.totalRevenue);
  $('metricCustomers').textContent = stats.totalCustomers || 0;
  renderAppointments($('adminAppointments'), appointments);
  await loadProfit();
}

async function loadProfit() {
  const commission = Number($('commissionInput').value || 50);
  const data = await api(`/api/admin/profit-distribution?commission=${commission}`);
  $('profitList').innerHTML = data.barbers.length ? data.barbers.map((barber) => `
    <div class="item">
      <strong>${barber.barberName}</strong>
      <small>${barber.servicesPerformed} serviços • bruto ${money(barber.grossRevenue)}<br>
      Barbeiro: ${money(barber.barberShare)} • Casa: ${money(barber.houseShare)}</small>
    </div>
  `).join('') : '<div class="item"><small>Nenhum barbeiro encontrado.</small></div>';
}

function renderAppointments(target, appointments, canUpdate = false) {
  target.innerHTML = appointments.length ? appointments.map((appointment) => `
    <div class="item">
      <strong>${appointment.serviceName || 'Serviço'} • ${appointment.status}</strong>
      <small>
        ${shortDate(appointment.date)} às ${String(appointment.time || '').slice(0, 5)}<br>
        Barbeiro: ${appointment.barberName || '-'}${appointment.customerName ? `<br>Cliente: ${appointment.customerName}` : ''}
      </small>
      ${canUpdate ? `
        <div class="item-actions">
          <button class="secondary" onclick="updateStatus('${appointment.id}', 'CONFIRMED')">Confirmar</button>
          <button class="secondary" onclick="updateStatus('${appointment.id}', 'COMPLETED')">Concluir</button>
          <button class="secondary danger" onclick="updateStatus('${appointment.id}', 'CANCELLED')">Cancelar</button>
        </div>
      ` : ''}
    </div>
  `).join('') : '<div class="item"><small>Nenhum agendamento encontrado.</small></div>';
}

async function updateStatus(id, status) {
  await api(`/api/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  await loadDashboard();
}

// Event listeners
$('loginTab').addEventListener('click', () => switchAuth('login'));
$('registerTab').addEventListener('click', () => switchAuth('register'));

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
    setStatus($('authStatus'), 'Login realizado.', 'ok');
    renderSession();
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('authStatus'), 'Criando conta...');
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('registerName').value.trim(),
        email: $('registerEmail').value.trim(),
        phone: $('registerPhone').value.trim(),
        password: $('registerPassword').value,
        role: $('registerRole').value
      })
    });
    token = data.token;
    user = data.user;
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
    setStatus($('authStatus'), 'Conta criada e conectada.', 'ok');
    renderSession();
  } catch (error) {
    setStatus($('authStatus'), error.message, 'error');
  }
});

$('bookingForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus($('bookingStatus'), 'Agendando...');
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
    setStatus($('bookingStatus'), 'Agendamento salvo no banco online.', 'ok');
    await loadCustomer();
  } catch (error) {
    setStatus($('bookingStatus'), error.message, 'error');
  }
});

$('refreshBtn').addEventListener('click', () => loadDashboard());
$('loadProfitBtn').addEventListener('click', () => loadProfit());
$('logoutBtn').addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  renderSession();
});

window.updateStatus = updateStatus;
renderSession();
