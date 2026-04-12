import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🔗 Conectando ao TiDB Cloud...');
console.log('  Host:', process.env.DATABASE_HOST);
console.log('  Port:', process.env.DATABASE_PORT);

// Carregar certificado CA
const caPath = path.resolve(process.env.DATABASE_CA_PATH || './ca.pem');
let caCert = null;

if (fs.existsSync(caPath)) {
  caCert = fs.readFileSync(caPath, 'utf8');
  console.log('✅ Certificado CA carregado');
} else {
  console.warn('⚠️  CA.pem não encontrado em:', caPath);
}

const db = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: caCert ? { ca: [caCert] } : 'Amazon RDS',
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  enableKeepAlive: true
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro na conexão:', err.message);
    process.exit(1);
  }
  connection.release();
  console.log('✅ Conectado ao TiDB Cloud com sucesso!');
});

export default db;
