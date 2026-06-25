import mysql from 'mysql2/promise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const caPath = process.env.DATABASE_CA_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_CA_PATH)
  : path.join(__dirname, 'ca.pem');

if (!process.env.DATABASE_CA && !fs.existsSync(caPath)) {
  console.error('Database CA certificate not found. Set DATABASE_CA or DATABASE_CA_PATH.');
  process.exit(1);
}

const caCert = process.env.DATABASE_CA
  ? process.env.DATABASE_CA.replace(/\\n/g, '\n')
  : fs.readFileSync(caPath, 'utf8');

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 4000),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { ca: [caCert] }
});

console.log('\nESTRUTURA DA TABELA USERS:\n');
const [structure] = await connection.query('DESCRIBE users');
console.table(structure);

console.log('\nUSUARIOS CADASTRADOS:\n');
const [users] = await connection.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
console.table(users);
console.log(`\nTotal: ${users.length} usuarios\n`);

await connection.end();
