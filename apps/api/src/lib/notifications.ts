import nodemailer from 'nodemailer';
import { prisma } from './prisma.js';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  fromName?: string;
  secure?: boolean;
}
interface SmsConfig {
  provider: string; // 'console' | 'smsapi' | 'serwersms'
  apiKey: string;
  sender: string;
}

async function getSetting<T>(key: string): Promise<T | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row ? (JSON.parse(row.value) as T) : null;
}

export async function sendEmail(args: {
  orderId: string;
  to: string;
  subject: string;
  body: string;
  trigger: string;
}) {
  const cfg = await getSetting<SmtpConfig>('smtp');
  const log = await prisma.notificationLog.create({
    data: {
      orderId: args.orderId,
      channel: 'EMAIL',
      trigger: args.trigger,
      toAddress: args.to,
      subject: args.subject,
      body: args.body,
      status: 'QUEUED',
    },
  });

  if (!cfg || !cfg.host) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: 'Brak konfiguracji SMTP (skonfiguruj w panelu właściciela).' },
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port) || 587,
      secure: !!cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
    });
    const info = await transporter.sendMail({
      from: cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from,
      to: args.to,
      subject: args.subject,
      text: args.body,
    });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date(), providerMessageId: info.messageId },
    });
  } catch (e: any) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: e?.message ?? String(e) },
    });
  }
}

export async function sendSms(args: {
  orderId: string;
  to: string;
  body: string;
  trigger: string;
}) {
  const cfg = await getSetting<SmsConfig>('sms');
  const log = await prisma.notificationLog.create({
    data: {
      orderId: args.orderId,
      channel: 'SMS',
      trigger: args.trigger,
      toAddress: args.to,
      body: args.body,
      status: 'QUEUED',
    },
  });

  if (!cfg) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: 'Brak konfiguracji SMS.' },
    });
    return;
  }

  // Wbudowany "console" provider — działa bez konta u dostawcy.
  // Pozostali dostawcy (smsapi, serwersms, twilio) — do zaimplementowania.
  if (cfg.provider === 'console' || !cfg.apiKey) {
    // eslint-disable-next-line no-console
    console.log(`[SMS-CONSOLE] do=${args.to} treść="${args.body}"`);
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date(), providerMessageId: 'console-' + log.id },
    });
    return;
  }

  // Stub: realnej integracji nie wykonujemy, ale logujemy „SENT" tylko dla
  // znanych providerów; w przeciwnym razie failujemy.
  await prisma.notificationLog.update({
    where: { id: log.id },
    data: {
      status: 'FAILED',
      error: `Provider "${cfg.provider}" wymaga implementacji integracji.`,
    },
  });
}

export function renderTemplate(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
}
