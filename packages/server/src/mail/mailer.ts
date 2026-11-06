import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export interface SmtpConfig {
  host: string;
  port: number;
  from: string;
  user?: string;
  password?: string;
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
  });
  return {
    async send(mail) {
      await transport.sendMail({ from: config.from, ...mail });
    },
  };
}
