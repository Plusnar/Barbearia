import { google } from 'googleapis';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

export const isGmailConfigured = () => Boolean(
  process.env.GMAIL_CLIENT_ID
  && process.env.GMAIL_CLIENT_SECRET
  && process.env.GMAIL_REFRESH_TOKEN
  && process.env.EMAIL_FROM_ADDRESS
);

const encodeSubject = (subject) => `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;

const encodeRawMessage = (message) => Buffer.from(message, 'utf8')
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const buildMimeMessage = ({
  fromName,
  fromEmail,
  toName,
  toEmail,
  subject,
  textContent,
  htmlContent
}) => {
  const boundary = `barbearia_${Date.now()}`;
  const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const toHeader = toName ? `${toName} <${toEmail}>` : toEmail;

  return [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textContent,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlContent,
    '',
    `--${boundary}--`
  ].join('\r\n');
};

const createOAuthClient = () => {
  const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3333/oauth2callback';

  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  return client;
};

export const sendGmailMessage = async ({
  fromName,
  fromEmail,
  to,
  subject,
  textContent,
  htmlContent
}) => {
  if (!isGmailConfigured()) {
    console.warn('Gmail API is not configured. Skipping email.');
    return { skipped: true };
  }

  const auth = createOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = encodeRawMessage(buildMimeMessage({
    fromName,
    fromEmail,
    toName: to.name,
    toEmail: to.email,
    subject,
    textContent,
    htmlContent
  }));

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    return {
      success: true,
      messageId: response.data.id
    };
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error.message;
    throw new Error(`Gmail API failed: ${detail}`);
  }
};

export const getGmailAuthUrl = (redirectUri) => {
  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GMAIL_SCOPE]
  });
};

export const exchangeGmailAuthCode = async (code, redirectUri) => {
  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await client.getToken(code);
  return tokens;
};
