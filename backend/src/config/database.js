import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Database Configuration:');
console.log('  HOST:', process.env.DATABASE_HOST);
console.log('  PORT:', process.env.DATABASE_PORT);
console.log('  DATABASE:', process.env.DATABASE_NAME);
console.log('  USER:', process.env.DATABASE_USER);

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 3306,
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'barbearia',
  waitForConnections: true,
  enableKeepAlive: true
});

db.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Database had a fatal error.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') {
    console.error('Database connection was manually closed.');
  }
});

export default db;
