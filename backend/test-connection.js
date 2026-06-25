import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Buscar arquivo .env
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log('📄 Usando arquivo de ambiente:', envPath);
} else {
  console.error('❌ Nenhum arquivo .env encontrado!');
  process.exit(1);
}

console.log('\n🔍 Testando conexão com TiDB Cloud...\n');
console.log('Credenciais:');
console.log('  Host:', process.env.DATABASE_HOST);
console.log('  Port:', process.env.DATABASE_PORT);
console.log('  User:', process.env.DATABASE_USER ? process.env.DATABASE_USER.substring(0, 10) + '...' : undefined);
console.log('  Database:', process.env.DATABASE_NAME);
console.log('');

// Carregar certificado CA
let caCert = null;
const caPaths = [
  path.resolve(process.cwd(), 'ca.pem'),
  path.resolve(__dirname, 'ca.pem'),
];

for (const caPath of caPaths) {
  if (fs.existsSync(caPath)) {
    caCert = fs.readFileSync(caPath, 'utf8');
    console.log('✅ Certificado CA carregado de:', caPath);
    break;
  }
}

try {
  console.log('⏳ Conectando...\n');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: {
      ca: caCert ? [caCert] : undefined,
      rejectUnauthorized: false
    },
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 15000
  });

  console.log('✅ Conectado com sucesso!');

  // Teste simples
  const [rows] = await connection.query('SELECT 1 as test');
  console.log('✅ Query de teste executada:', rows);

  // Verificar tabelas
  const [tables] = await connection.query('SHOW TABLES');
  console.log('✅ Tabelas do banco:', tables);

  await connection.end();
  console.log('\n✅ Conexão encerrada com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro na conexão:');
  console.error('  Mensagem:', error.message);
  console.error('  Código:', error.code);
  if (error.stack) console.error('  Stack:', error.stack);
  process.exit(1);
}
