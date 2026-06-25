import mysql from 'mysql2/promise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const caPath = path.join(__dirname, 'ca.pem');

const caCert = fs.readFileSync(caPath, 'utf8');

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: process.env.DATABASE_PORT || 4000,
  user: process.env.DATABASE_USER || '3YC71VMTZLLsoRE.root',
  password: process.env.DATABASE_PASSWORD || 'gQ6kW9eJReKHNVNs',
  database: process.env.DATABASE_NAME || 'barbearia',
  ssl: { ca: [caCert] }
});

console.log('\n� ESTRUTURA DA TABELA USERS:\n');

const [structure] = await connection.query('DESCRIBE users');
console.table(structure);

console.log('\n📊 USUÁRIOS CADASTRADOS:\n');

const [users] = await connection.query('SELECT * FROM users');
console.table(users);

console.log(`\n✅ Total: ${users.length} usuários\n`);

await connection.end();
