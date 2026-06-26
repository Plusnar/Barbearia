import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env')
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log('Environment file loaded:', envPath);
} else {
  dotenv.config();
  console.warn('No .env file found in expected paths.');
}

const requiredEnv = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME'
];

let pool;

const validateDatabaseEnv = () => {
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    throw new Error(`Missing database environment variables: ${missingEnv.join(', ')}`);
  }
};

const loadCaCert = () => {
  if (process.env.DATABASE_CA) {
    console.log('Database CA certificate loaded from DATABASE_CA env');
    return process.env.DATABASE_CA.replace(/\\n/g, '\n');
  }

  const caPaths = [
    process.env.DATABASE_CA_PATH,
    path.resolve(__dirname, '../../ca.pem'),
    path.resolve(process.cwd(), 'ca.pem'),
    path.resolve(process.cwd(), 'backend/ca.pem')
  ].filter(Boolean);

  for (const caPath of caPaths) {
    if (fs.existsSync(caPath)) {
      console.log('Database CA certificate loaded:', caPath);
      return fs.readFileSync(caPath, 'utf8');
    }
  }

  console.warn('Database CA certificate not found. Connecting without CA certificate.');
  return null;
};

const createDatabasePool = () => {
  validateDatabaseEnv();

  const caCert = loadCaCert();

  console.log('Connecting to database host:', process.env.DATABASE_HOST);
  console.log('Connecting to database port:', process.env.DATABASE_PORT);

  return mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: caCert
      ? { ca: [caCert], rejectUnauthorized: true }
      : { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    connectTimeout: 10000
  });
};

export const getDatabasePool = () => {
  if (!pool) {
    pool = createDatabasePool();
  }

  return pool;
};

export const verifyDatabaseConnection = () => new Promise((resolve, reject) => {
  getDatabasePool().getConnection((err, connection) => {
    if (err) {
      reject(err);
      return;
    }

    connection.release();
    resolve();
  });
});

const db = {
  query(...args) {
    return getDatabasePool().query(...args);
  },

  getConnection(callback) {
    try {
      return getDatabasePool().getConnection(callback);
    } catch (error) {
      if (typeof callback === 'function') {
        callback(error);
        return undefined;
      }

      throw error;
    }
  },

  end(...args) {
    if (!pool) return undefined;
    return pool.end(...args);
  }
};

export default db;
