import { isGmailConfigured, sendGmailMessage } from './gmail-client.js';

const resolveEmailProvider = () => {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER.toLowerCase();
  }

  if (isGmailConfigured()) {
    return 'gmail';
  }

  return 'none';
};

const getNotificationConfig = () => ({
  provider: resolveEmailProvider(),
  fromName: process.env.EMAIL_FROM_NAME || process.env.NOTIFICATION_FROM || 'Barbearia',
  fromEmail: process.env.EMAIL_FROM_ADDRESS
});

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildEmailContent = (payload) => {
  const safeMessage = escapeHtml(payload.message);
  const recoveryCode = payload.data?.recoveryCode;
  const appointment = payload.data?.appointment;

  return {
    textContent: [
      payload.message,
      recoveryCode ? `Codigo: ${recoveryCode}` : '',
      appointment ? `Servico: ${appointment.serviceName}\nBarbeiro: ${appointment.barberName}\nData: ${appointment.date}\nHorario: ${appointment.time}` : ''
    ].filter(Boolean).join('\n\n'),
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
          <p>${safeMessage}</p>
          ${recoveryCode ? `
            <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827;">
              ${escapeHtml(recoveryCode)}
            </p>
          ` : ''}
          ${appointment ? `
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; margin: 12px 0;">
              <p><strong>Servico:</strong> ${escapeHtml(appointment.serviceName)}</p>
              <p><strong>Barbeiro:</strong> ${escapeHtml(appointment.barberName)}</p>
              <p><strong>Data:</strong> ${escapeHtml(appointment.date)}</p>
              <p><strong>Horario:</strong> ${escapeHtml(appointment.time)}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `
  };
};

const postNotification = async (payload) => {
  const config = getNotificationConfig();
  const content = buildEmailContent(payload);

  if (config.provider !== 'gmail') {
    console.warn(`Email provider "${config.provider}" is not configured. Skipping notification:`, payload.type);
    return { skipped: true };
  }

  return sendGmailMessage({
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    to: payload.to,
    subject: payload.subject,
    textContent: content.textContent,
    htmlContent: content.htmlContent
  });
};

export const sendAccountCreatedNotification = async (user) => {
  return postNotification({
    type: 'ACCOUNT_CREATED',
    to: {
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    subject: 'Conta criada com sucesso',
    message: `Ola, ${user.name}. Sua conta na barbearia foi criada com sucesso.`
  });
};

export const sendAccountRecoveryCodeNotification = async (user, recoveryCode, expiresInMinutes) => {
  return postNotification({
    type: 'ACCOUNT_RECOVERY_CODE',
    to: {
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    subject: 'Codigo para recuperar sua conta',
    message: `Ola, ${user.name}. Use o codigo abaixo no app para recuperar sua conta. Ele expira em ${expiresInMinutes} minutos.`,
    data: {
      recoveryCode,
      expiresInMinutes
    }
  });
};

export const sendPasswordChangedNotification = async (user) => {
  return postNotification({
    type: 'PASSWORD_CHANGED',
    to: {
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    subject: 'Senha alterada com sucesso',
    message: `Ola, ${user.name}. Sua senha da Barbearia Castilho foi alterada com sucesso. Se voce nao fez essa alteracao, entre em contato com a barbearia.`
  });
};

export const sendAppointmentConfirmedNotification = async (user, appointment) => {
  return postNotification({
    type: 'APPOINTMENT_CONFIRMED',
    to: {
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    subject: 'Seu corte foi confirmado',
    message: `Ola, ${user.name}. Seu corte na Barbearia Castilho foi confirmado.`,
    data: {
      appointment
    }
  });
};
