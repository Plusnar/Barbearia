# BARBEARIA - Barbershop Management System

Complete barbershop management solution with Android app, REST API, and MySQL database.

---

## PROJECT STRUCTURE

```
Barbearia/
├── android/                    # Android application
│   ├── app/
│   │   └── src/main/
│   │       ├── java/com/barbearia/app/
│   │       │   ├── data/
│   │       │   │   ├── api/          # API clients and auth
│   │       │   │   └── model/        # Data models
│   │       │   └── ui/
│   │       │       ├── adapter/      # RecyclerView adapters
│   │       │       ├── admin/        # Admin dashboard
│   │       │       ├── auth/         # Authentication screens
│   │       │       ├── barber/       # Barber dashboard
│   │       │       └── customer/     # Customer screens
│   │       └── res/
│   │           ├── layout/           # XML layouts
│   │           └── values/           # Strings and resources
│   └── build.gradle
│
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/             # Database config
│   │   ├── middleware/         # Auth middleware
│   │   └── routes/             # API endpoints
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql              # MySQL setup script
│
└── README.md
```

---

## SETUP INSTRUCTIONS

### 1. DATABASE SETUP (MySQL/phpMyAdmin)

1. Open phpMyAdmin or MySQL client
2. Execute the SQL script from `database/schema.sql`:
   - Creates `barbearia` database
   - Creates all tables (users, appointments, services, payments)
   - Inserts 3 default barbers
   - Inserts default admin user (email: admin@barbearia.com, password: admin123)
   - Inserts 3 default service packages

### 2. BACKEND API SETUP (Node.js)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Update values:
     ```
     PORT=5000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=barbearia
     JWT_SECRET=your_secure_secret_key
     NODE_ENV=development
     ```

4. Start server:
   ```bash
   npm start              # Production
   npm run dev            # Development with nodemon
   ```

   Server runs on `http://localhost:5000`

### 3. ANDROID APP SETUP

1. Open Android Studio
2. Open project: `android/`
3. Update API base URL in `src/config/database.js`:
   - Replace `192.168.0.101` with your backend server IP
4. Build and run on emulator or device

---

## AUTHENTICATION SYSTEM

### Admin Credentials (Default)
- Email: `admin@barbearia.com`
- Password: `admin123`
- Permissions: Full system management, financial reports, user management

### Barber Credentials (Default)
- Email: `joao@barbearia.com` / `carlos@barbearia.com` / `pedro@barbearia.com`
- Password: `barber123`
- Permissions: View appointments, receive notifications

### Customer Registration
- Self-registration via app
- Email, phone, and password required

---

## API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Login any user

### Appointments (Protected)
- `GET /api/appointments/available-slots?date=YYYY-MM-DD` - Get available time slots
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/customer` - Customer's appointments
- `GET /api/appointments/barber` - Barber's appointments
- `PUT /api/appointments/{id}/status` - Update appointment status

### Services (Protected)
- `GET /api/services` - List all services
- `GET /api/services/barbers` - List available barbers
- `POST /api/services` - Create service (admin only)
- `PUT /api/services/{id}` - Update service (admin only)
- `DELETE /api/services/{id}` - Delete service (admin only)

### Admin (Admin Only)
- `GET /api/admin/statistics` - Financial and operational stats
- `GET /api/admin/appointments` - All appointments
- `DELETE /api/admin/users/{id}` - Delete user

---

## SERVICE PACKAGES (Default 3-Tier System)

1. **Corte Básico** - R$ 25.00 (30 min)
   Basic haircut with machine and scissors

2. **Corte Premium** - R$ 45.00 (45 min)
   Personalized cut with finishing and hydration

3. **Corte Completo** - R$ 65.00 (60 min)
   Full service: haircut + beard + design + eyebrows

---

## FEATURES

### Customer Features
- Create account with email/phone verification
- Browse available barbers and services
- Select date and time using date picker
- View appointment history
- Appointment status tracking
- Clean, intuitive booking interface

### Barber Features
- View assigned appointments
- Accept/confirm bookings
- Mark appointments as completed
- See customer details

### Admin Features
- Dashboard with real-time statistics
- Total appointments and completed count
- Revenue tracking
- Active barbers count
- Customer management
- Service/package management
- View all appointments across system
- User account management

---

## TECHNOLOGY STACK

**Frontend (Android)**
- Kotlin
- Retrofit 2 (HTTP client)
- Room (local storage)
- Material Design
- AndroidX libraries

**Backend (API)**
- Node.js
- Express.js
- JWT authentication
- bcryptjs (password hashing)

**Database**
- MySQL 8.0+
- Encrypted shared preferences for auth tokens

---

## SECURITY FEATURES

- JWT token-based authentication
- Password hashing with bcryptjs
- Encrypted SharedPreferences for local storage
- Role-based access control (RBAC)
- Token expiration (30 days)
- Protected API endpoints

---

## TROUBLESHOOTING

### Database Connection Failed
- Verify MySQL server is running
- Check DB credentials in backend `.env`
- Confirm database was created from schema.sql

### API Not Responding
- Ensure backend server is running on port 5000
- Check network connectivity
- Verify IP address in Android app config

### Authentication Failing
- Clear app cache and try again
- Verify JWT_SECRET in backend matches
- Check database users table for valid credentials

---

## FUTURE EXPANSIONS

- Push notifications for barber appointments
- Online payment integration
- Rating and review system
- Loyalty points program
- Barber availability calendar
- SMS/Email notifications
- Appointment reminders
- Multiple location support
- Barber performance analytics
