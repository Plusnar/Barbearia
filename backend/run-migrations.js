import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const caPath = path.resolve(__dirname, 'ca.pem');
const caCert = fs.readFileSync(caPath, 'utf8');

const migrations = [
  '002_financial_audit_log.sql',
  '003_soft_delete.sql',
  '004_financial_snapshots.sql',
  '005_orphan_lock_cleanup.sql',
  '006_password_reset_tokens.sql'
];

const splitStatements = (sql) => sql
  .split(';')
  .map((statement) => statement.trim())
  .filter((statement) => statement && !statement.startsWith('--'));

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 4000),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
    ssl: { ca: [caCert], rejectUnauthorized: true }
  });

  for (const file of migrations) {
    const filePath = path.resolve(__dirname, '../database/migrations', file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${file}...`);

    for (const statement of splitStatements(sql)) {
      try {
        await connection.query(statement);
      } catch (error) {
        if (['ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME'].includes(error.code)) {
          console.log(`  Skipped (already applied): ${error.message}`);
          continue;
        }

        throw error;
      }
    }

    console.log(`  Done: ${file}`);
  }

  await connection.end();
  console.log('All migrations completed.');
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
