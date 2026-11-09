import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export type MailKind =
  | "verify-email"
  | "reset-password"
  | "password-changed"
  | "existing-account"
  | "provider-linked"
  | "provider-unlinked";

/** What a log may say about a mail. Never the address or the text. */
export interface MailTag {
  kind: MailKind;
  userId: string;
}

export interface Mailer {
  send(mail: Mail, tag: MailTag): Promise<void>;
}

export interface SmtpConfig {
  host: string;
  port: number;
  from: string;
  user?: string;
  password?: string;
}

export function readSmtpConfig(
  env: Record<string, string | undefined>,
): SmtpConfig {
  return {
    host: env.SMTP_HOST ?? "localhost",
    port: Number(env.SMTP_PORT ?? 1025),
    from: env.MAIL_FROM ?? "Meritory <no-reply@meritory.localhost>",
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  };
}

/** Mailpit locally, SES SMTP in AWS */
export function createSmtpMailer(config: SmtpConfig): Mailer {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user
      ? { user: config.user, pass: config.password ?? "" }
      : undefined,
    // A stuck server fails this try fast, and the queue tries again later
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  return {
    async send(mail) {
      await transport.sendMail({ from: config.from, ...mail });
    },
  };
}
