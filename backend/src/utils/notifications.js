import nodemailer from 'nodemailer';

const getNotificationConfig = () => ({
  provider: process.env.EMAIL_PROVIDER || (
    process.env.MAILERSEND_API_KEY ? 'mailersend' : process.env.SMTP_HOST ? 'smtp' : process.env.BREVO_API_KEY ? 'brevo' : 'generic'
  ),
  apiUrl: process.env.NOTIFICATION_API_URL,
  apiKey: process.env.NOTIFICATION_API_KEY,
  fromName: process.env.EMAIL_FROM_NAME || process.env.NOTIFICATION_FROM || 'Barbearia',
  fromEmail: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
  brevoApiKey: process.env.BREVO_API_KEY,
  mailerSendApiKey: process.env.MAILERSEND_API_KEY,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
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

const sendBrevoEmail = async (config, payload) => {
  if (!config.brevoApiKey || !config.fromEmail) {
    console.warn('Brevo email is not configured. Skipping notification:', payload.type);
    return { skipped: true };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.brevoApiKey
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName,
        email: config.fromEmail
      },
      to: [
        {
          email: payload.to.email,
          name: payload.to.name
        }
      ],
      subject: payload.subject,
      ...buildEmailContent(payload)
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brevo email failed with status ${response.status}: ${message}`);
  }

  return response.json().catch(() => ({ success: true }));
};

const sendMailerSendEmail = async (config, payload) => {
  if (!config.mailerSendApiKey || !config.fromEmail) {
    console.warn('MailerSend email is not configured. Skipping notification:', payload.type);
    return { skipped: true };
  }

  const content = buildEmailContent(payload);
  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${config.mailerSendApiKey}`
    },
    body: JSON.stringify({
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      to: [
        {
          email: payload.to.email,
          name: payload.to.name
        }
      ],
      subject: payload.subject,
      text: content.textContent,
      html: content.htmlContent
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`MailerSend email failed with status ${response.status}: ${message}`);
  }

  return {
    success: true,
    messageId: response.headers.get('x-message-id')
  };
};

const sendSmtpEmail = async (config, payload) => {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass || !config.fromEmail) {
    console.warn('SMTP email is not configured. Skipping notification:', payload.type);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
  const content = buildEmailContent(payload);

  const result = await transporter.sendMail({
    from: {
      name: config.fromName,
      address: config.fromEmail
    },
    to: {
      name: payload.to.name,
      address: payload.to.email
    },
    subject: payload.subject,
    text: content.textContent,
    html: content.htmlContent
  });

  return {
    success: true,
    messageId: result.messageId
  };
};

const sendGenericNotification = async (config, payload) => {
  if (!config.apiUrl) {
    console.warn('Notification API is not configured. Skipping notification:', payload.type);
    return { skipped: true };
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
    },
    body: JSON.stringify({
      from: config.fromName,
      ...payload
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Notification API failed with status ${response.status}: ${message}`);
  }

  return response.json().catch(() => ({ success: true }));
};

const postNotification = async (payload) => {
  const config = getNotificationConfig();

  if (typeof fetch !== 'function') {
    console.warn('Global fetch is not available in this Node.js runtime.');
    return { skipped: true };
  }

  if (config.provider === 'brevo') {
    return sendBrevoEmail(config, payload);
  }

  if (config.provider === 'mailersend') {
    return sendMailerSendEmail(config, payload);
  }

  if (config.provider === 'smtp') {
    return sendSmtpEmail(config, payload);
  }

  return sendGenericNotification(config, payload);
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
