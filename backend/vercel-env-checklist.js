import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const caPath = path.resolve(__dirname, 'ca.pem');

const requiredForVercel = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'JWT_SECRET'
];

const optionalForVercel = [
  'FRONTEND_URL',
  'PASSWORD_RESET_URL',
  'CORS_ORIGIN',
  'EMAIL_PROVIDER',
  'EMAIL_FROM_NAME',
  'EMAIL_FROM_ADDRESS',
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN'
];

const parseEnv = (content) => content
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const index = line.indexOf('=');
    if (index === -1) return acc;
    acc[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    return acc;
  }, {});

const env = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};

console.log('Checklist de variaveis para Vercel (Project Settings > Environment Variables > Production):\n');

requiredForVercel.forEach((key) => {
  const value = env[key];
  console.log(`${value ? 'OK' : 'FALTA'}  ${key}${value ? '' : '  <- configure no painel Vercel'}`);
});

console.log('\nRecomendadas:\n');

optionalForVercel.forEach((key) => {
  const value = env[key];
  console.log(`${value ? 'OK' : 'opcional'}  ${key}`);
});

console.log('\nDATABASE_CA:');
if (env.DATABASE_CA) {
  console.log('OK  DATABASE_CA (ja definida no .env local)');
} else if (fs.existsSync(caPath)) {
  console.log('OK  backend/ca.pem existe no repo (Vercel pode usar o arquivo em runtime)');
  console.log('     Alternativa: copiar conteudo do ca.pem para DATABASE_CA no painel Vercel');
} else {
  console.log('FALTA  defina DATABASE_CA ou inclua backend/ca.pem no deploy');
}

console.log('\nFRONTEND_URL / CORS_ORIGIN:');
console.log('Use a URL publica do app, ex.: https://seu-projeto.vercel.app');
console.log('Se nao definir, o backend usa VERCEL_URL automaticamente no deploy.');

console.log('\nImportante:');
console.log('- O arquivo .env local NAO vai para o Vercel automaticamente.');
console.log('- As migrations ja foram aplicadas no TiDB (vale para local e Vercel).');
console.log('- No TiDB Cloud, libere acesso publico ou IPs do Vercel na rede do cluster.');
