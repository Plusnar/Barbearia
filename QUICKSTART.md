# QUICK START GUIDE

## 5-Minute Setup

### Step 1: Database Setup
```bash
# Open MySQL client
mysql -u root -p

# Import schema
mysql> SOURCE database/schema.sql;
```

Default credentials:
- Admin: `admin@barbearia.com` / `admin123`
- Barber: `joao@barbearia.com` / `barber123`
- Customer: Register via app

---

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env if needed (or use defaults)
# PORT=5000
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=barbearia
# JWT_SECRET=your_secret_key

# Start server
npm start
```

Server ready at: `http://localhost:5000`

---

### Step 3: Android App Setup
1. Open `android/` folder in Android Studio
2. Sync Gradle (wait for indexing)
3. Update IP in [RetrofitClient.kt](android/app/src/main/java/com/barbearia/app/data/api/RetrofitClient.kt):
   ```kotlin
   private const val BASE_URL = "http://YOUR_LOCAL_IP:5000/api/"
   ```
4. Build and run on emulator or device

---

## Docker Setup (Recommended)

```bash
# One command setup
docker-compose up -d

# Check services
docker ps

# View logs
docker logs barbearia-api
docker logs barbearia-db
```

Everything runs on:
- API: http://localhost:5000
- MySQL: localhost:3306
- User: root
- Password: root

---

## Testing the System

### 1. Test Backend API
```bash
# Register new customer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "phone": "11999999999",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }'

# Get services (use returned token)
curl -X GET http://localhost:5000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Android App
1. **Register**: Create new account
2. **Login**: Use registered credentials
3. **Book**: Create appointment with date, time, barber, service
4. **Track**: View appointment in "My Appointments"
5. **Admin**: Login with `admin@barbearia.com` / `admin123`

---

## Directory Structure

```
Barbearia/
├── android/                 # Android app source
├── backend/                 # Node.js API
├── database/
│   └── schema.sql          # MySQL setup
├── ARCHITECTURE.md         # System design
├── DEPLOYMENT.md           # Production guide
├── README.md               # Main documentation
├── docker-compose.yml      # Docker setup
└── .gitignore
```

---

## Common Issues & Fixes

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Check database connection
mysql -h localhost -u root -p barbearia -e "SELECT 1;"
```

### Android app won't connect
- Update IP in RetrofitClient.kt
- Check firewall allows port 5000
- Ensure backend is running: `curl http://YOUR_IP:5000/api/services`

### Database import failed
```bash
# Check file syntax
mysql -u root -p < database/schema.sql

# Or import via phpMyAdmin
# 1. Open http://localhost/phpmyadmin
# 2. Click "Import"
# 3. Select database/schema.sql
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@test.com",
    "role": "CUSTOMER",
    "createdAt": 1234567890
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Default Services Pricing

| Service | Price | Duration |
|---------|-------|----------|
| Basic Cut | R$ 25.00 | 30 min |
| Premium Cut | R$ 45.00 | 45 min |
| Complete Service | R$ 65.00 | 60 min |

---

## Next Steps After Setup

1. **Customize Branding**
   - Update app colors in `android/app/src/main/res/values/colors.xml`
   - Modify app icon and splash screen

2. **Add More Services**
   - Use Admin panel to create/edit services

3. **Add More Barbers**
   - Create barber users via admin panel or direct database insert

4. **Enable Notifications**
   - Integrate Firebase Cloud Messaging (FCM)
   - Add push notification logic

5. **Add Payment Integration**
   - Integrate with payment gateway (Stripe, PayPal, etc.)

---

## Documentation Files

- `README.md` - Main project documentation
- `ARCHITECTURE.md` - Detailed system architecture
- `DEPLOYMENT.md` - Production deployment guide
- This file - Quick start guide

---

## Support & Troubleshooting

### Check Logs
```bash
# Backend logs
docker logs barbearia-api

# Database logs
docker logs barbearia-db

# Android logcat
adb logcat | grep barbearia
```

### Useful Commands
```bash
# Restart services
docker-compose restart

# Reset everything
docker-compose down -v
docker-compose up -d

# Database backup
mysqldump -u root -p barbearia > backup.sql

# Database restore
mysql -u root -p barbearia < backup.sql
```

Ready to go! 🚀
