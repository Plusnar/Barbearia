import http from 'http';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exchangeGmailAuthCode, getGmailAuthUrl } from '../src/utils/gmail-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = Number(process.env.GMAIL_AUTH_PORT || 3333);
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`;

const required = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Defina no .env antes de rodar este script: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('\nIMPORTANTE:');
console.log('- NAO abra http://localhost:3333/oauth2callback manualmente.');
console.log('- Esse endereco so funciona DEPOIS que voce autorizar no Google.');
console.log('- Mantenha ESTE terminal aberto enquanto autoriza.\n');
console.log('1. Adicione esta URL em Google Cloud Console > Credentials > Authorized redirect URIs:');
console.log(`   ${REDIRECT_URI}\n`);
console.log('2. Abra o link GOOGLE abaixo (accounts.google.com), autorize e aguarde...\n');

const authUrl = getGmailAuthUrl(REDIRECT_URI);
console.log(authUrl);
console.log('');

const openAuthUrl = () => {
  if (process.platform === 'win32') {
    exec(`start "" "${authUrl}"`);
    console.log('Abrindo o link de autorizacao no navegador...\n');
    return;
  }

  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${opener} "${authUrl}"`, () => {});
};

openAuthUrl();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Erro na autorizacao</h1><p>${error || 'Codigo ausente'}</p>`);
    server.close();
    process.exit(1);
    return;
  }

  try {
    const tokens = await exchangeGmailAuthCode(code, REDIRECT_URI);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Autorizacao concluida</h1><p>Volte ao terminal e copie o refresh token.</p>');

    console.log('\nAutorizacao concluida. Configure no .env e no Vercel:\n');
    console.log(`EMAIL_PROVIDER=gmail`);
    console.log(`EMAIL_FROM_ADDRESS=seu@gmail.com`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token || '(nao retornado - revogue acesso e tente de novo com prompt=consent)'}`);

    if (tokens.access_token) {
      console.log(`\nAccess token (temporario): ${tokens.access_token.slice(0, 20)}...`);
    }

    console.log('\nImportante: use o mesmo EMAIL_FROM_ADDRESS da conta Gmail autorizada.');
    server.close();
    process.exit(0);
  } catch (authError) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Falha</h1><pre>${authError.message}</pre>`);
    console.error('\nErro ao trocar codigo por token:', authError.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor OAuth aguardando callback em ${REDIRECT_URI}`);
  console.log('Se der "conexao recusada", este terminal foi fechado cedo demais.\n');
});
