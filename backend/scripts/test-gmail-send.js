import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.gmail') });

const targetEmail = process.argv[2] || 'tarefascoletivos@gmail.com';
const useProduction = process.argv.includes('--production');
const apiBase = useProduction
  ? 'https://barbearia-castilho.vercel.app'
  : `http://localhost:${process.env.PORT || 5000}`;

const body = {
  email: targetEmail,
  name: 'Teste Barbearia Castilho'
};

if (useProduction) {
  const testKey = process.env.NOTIFICATION_TEST_API_KEY || 'dev-test-key-local';
  const response = await fetch(`${apiBase}/api/auth/notifications/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notification-test-key': testKey
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  console.log('Modo:', 'Vercel (API)');
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(data, null, 2));
  process.exit(response.ok ? 0 : 1);
}

const { sendAccountCreatedNotification } = await import('../src/utils/notifications.js');
const result = await sendAccountCreatedNotification(body);
console.log('Modo:', 'Gmail direto (local)');
console.log('Destino:', targetEmail);
console.log('Resultado:', JSON.stringify(result, null, 2));
