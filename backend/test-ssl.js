import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log('📄 Usando:', envPath);
}

console.log('\n🔍 Testando sem SSL primeiro...\n');

try {
  console.log('⏳ Tentando conectar sem SSL...');
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectTimeout: 10000
  });

  console.log('✅ Conectado!');
  await conn.end();
} catch (err) {
  console.error('❌ Sem SSL falhou:', err.message);
  console.error('Código:', err.code);

  console.log('\n⏳ Tentando com SSL agora...');

  try {
    const caCert = fs.readFileSync(path.resolve(__dirname, 'ca.pem'), 'utf8');
    const conn2 = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: { ca: [caCert], rejectUnauthorized: false },
      connectTimeout: 10000
    });

    console.log('✅ Conectado com SSL!');

    // Test
    const [result] = await conn2.query('SELECT 1 as test');
    console.log('✅ Teste OK:', result);

    await conn2.end();
  } catch (err2) {
    console.error('❌ Com SSL também falhou:', err2.message);
  }
}
