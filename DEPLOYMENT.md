# DEPLOYMENT GUIDE

## Local Development

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Android Studio 2022+
- Git

### MySQL Setup (Local)
```bash
# Start MySQL server
mysql -u root -p

# Execute in MySQL client
mysql> SOURCE database/schema.sql;
```

### Backend Setup (Local)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with local database credentials
npm run dev
```

### Android Setup (Local)
- Open `android/` in Android Studio
- Update IP in BaseURL to `localhost:5000`
- Run on emulator

---

## Docker Deployment

### Using Docker Compose (Recommended)
```bash
docker-compose up -d
```

Automatically sets up:
- MySQL database on port 3306
- Node.js API on port 5000
- Volume persistence for database

### Manual Docker Setup
```bash
# Build backend image
docker build -t barbearia-api ./backend

# Run MySQL container
docker run -d \
  --name barbearia-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=barbearia \
  -v barbearia-volume:/var/lib/mysql \
  mysql:8.0

# Run API container
docker run -d \
  --name barbearia-api \
  --link barbearia-db:mysql \
  -p 5000:5000 \
  -e DB_HOST=mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=root \
  -e DB_NAME=barbearia \
  -e JWT_SECRET=your_secret_key \
  barbearia-api
```

---

## Production Deployment (AWS/Heroku)

### Environment Variables Required
```
PORT=5000
DB_HOST=your_rds_endpoint
DB_USER=prod_user
DB_PASSWORD=strong_password
DB_NAME=barbearia_prod
JWT_SECRET=very_strong_random_secret_key
NODE_ENV=production
```

### Database Migration to RDS
1. Create RDS MySQL instance
2. Import schema using:
   ```bash
   mysql -h your_rds_endpoint -u admin -p barbearia < database/schema.sql
   ```
3. Update environment variables

### HTTPS/SSL Configuration
- Add SSL certificate to backend
- Update Android app to use HTTPS URLs
- Configure CORS for production domain

---

## Monitoring & Maintenance

### Database Backups
```bash
# Backup database
mysqldump -u root -p barbearia > barbearia_backup.sql

# Restore from backup
mysql -u root -p barbearia < barbearia_backup.sql
```

### Log Monitoring
```bash
# View Docker logs
docker logs barbearia-api
docker logs barbearia-db

# View system logs
tail -f backend/logs/error.log
```

### Performance Optimization
- Add database indexes on frequently queried fields
- Enable query caching
- Implement API rate limiting
- Use connection pooling

---

## Troubleshooting Production Issues

### API Connection Issues
- Check firewall rules
- Verify database credentials
- Check server logs for exceptions
- Verify JWT secret consistency

### Database Issues
- Check disk space
- Monitor slow queries
- Verify character encoding (utf8mb4)
- Check connection limits

### App Issues
- Clear app cache
- Verify SSL certificates
- Check NetworkSecurityConfig
- Review logcat for errors
