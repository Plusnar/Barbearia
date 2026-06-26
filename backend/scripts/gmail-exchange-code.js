import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exchangeGmailAuthCode } from '../src/utils/gmail-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = Number(process.env.GMAIL_AUTH_PORT || 3333);
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`;

const input = process.argv.slice(2).join(' ').trim();

if (!input) {
  console.error('Uso: npm run gmail:exchange -- "URL completa do callback"');
  console.error('Exemplo: npm run gmail:exchange -- "http://localhost:3333/oauth2callback?code=4/0A..."');
  process.exit(1);
}

let code = input;

try {
  if (input.startsWith('http')) {
    const url = new URL(input);
    code = url.searchParams.get('code');
  }
} catch {
  // input ja e o code puro
}

if (!code) {
  console.error('Nao encontrei o parametro code na URL informada.');
  process.exit(1);
}

if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
  console.error('Defina GMAIL_CLIENT_ID e GMAIL_CLIENT_SECRET no .env');
  process.exit(1);
}

try {
  const tokens = await exchangeGmailAuthCode(code, REDIRECT_URI);

  console.log('\nToken gerado com sucesso. Adicione no .env e no Vercel:\n');
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token || '(nao retornado - refaca o login com npm run gmail:auth)'}`);

  if (!tokens.refresh_token) {
    console.log('\nDica: revogue o acesso em https://myaccount.google.com/permissions e rode npm run gmail:auth de novo.');
    process.exit(1);
  }

  console.log(`\nEMAIL_FROM_ADDRESS=${process.env.EMAIL_FROM_ADDRESS || 'barbeariacastilho0@gmail.com'}`);
} catch (error) {
  console.error('\nFalha ao trocar codigo por token:', error.message);
  console.error('Codigos expiram em poucos minutos. Rode npm run gmail:auth e autorize de novo.');
  process.exit(1);
}
