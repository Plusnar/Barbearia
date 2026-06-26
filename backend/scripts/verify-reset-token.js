import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const email = process.argv[2] || 'tarefascoletivos@gmail.com';
const ca = fs.readFileSync(path.resolve(__dirname, '../ca.pem'), 'utf8');
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 4000),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { ca: [ca], rejectUnauthorized: true }
});

const [rows] = await connection.query(
  `SELECT prt.id, prt.expires_at, prt.used_at, u.email
   FROM password_reset_tokens prt
   JOIN users u ON u.id = prt.user_id
   WHERE u.email = ?
   ORDER BY prt.created_at DESC
   LIMIT 1`,
  [email]
);

console.log(rows[0] ? `Token OK para ${email} (expira ${rows[0].expires_at})` : `Nenhum token para ${email}`);
await connection.end();
