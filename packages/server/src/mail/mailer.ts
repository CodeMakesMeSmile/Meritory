import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { EMAIL_LOGOS } from "./email-layout.ts";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  /** The designed version. Mail queued before it existed has none. */
  html?: string;
}

export type MailKind =
  | "verify-email"
  | "finish-sign-up"
  | "reset-password"
  | "password-changed"
  | "existing-account"
  | "provider-linked"
  | "provider-unlinked"
  | "approve-email-change"
  | "email-in-use"
  | "confirm-new-email"
  | "email-changed"
  | "account-deleted";

/** What a log may say about a mail. Never the address or the text. */
export interface MailTag {
  kind: MailKind;
  userId: string;
}

export interface Mailer {
  send(mail: Mail, tag: MailTag): Promise<void>;
  /** Drops anything still waiting to go to this account */
  forget?(userId: string): Promise<void>;
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

/**
 * The most one send may take. Each SMTP timeout resets on activity, so a slow server could
 * hold a send past the queue's expiry and it would be tried again while still going.
 */
export const SEND_DEADLINE_MS = 45_000;

// Mailpit runs on this machine and has no certificate
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function smtpOptions(config: SmtpConfig): SMTPTransport.Options {
  const secure = config.port === 465;
  return {
    host: config.host,
    port: config.port,
    secure,
    // Otherwise a connection that loses STARTTLS on the way sends the mail unencrypted
    requireTLS: !secure && !LOCAL_HOSTS.has(config.host),
    auth: config.user
      ? { user: config.user, pass: config.password ?? "" }
      : undefined,
    // A stuck server fails this try fast, and the queue tries again later
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  };
}

/** Mailpit locally, SES SMTP in AWS */
export function createSmtpMailer(
  config: SmtpConfig,
  deadlineMs = SEND_DEADLINE_MS,
): Mailer {
  const transport = nodemailer.createTransport(smtpOptions(config));
  return {
    async send(mail) {
      await transport.sendMail({
        from: config.from,
        ...mail,
        attachments: mail.html ? EMAIL_LOGOS : undefined,
        // Closes the connection and fails with EABORT, so the queue tries again later
        signal: AbortSignal.timeout(deadlineMs),
      });
    },
  };
}
