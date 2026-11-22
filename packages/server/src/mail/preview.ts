import {
  accountDeleted,
  approveEmailChange,
  confirmNewEmail,
  emailChanged,
  emailInUse,
  existingAccount,
  finishSignUp,
  passwordChanged,
  providerLinked,
  providerUnlinked,
  resetPassword,
  verifyEmail,
} from "./emails.ts";
import type { Mail, MailKind } from "./mailer.ts";
import { createSmtpMailer, readSmtpConfig } from "./mailer.ts";

// Sends every email once, so a design change can be checked in real inboxes
const to = process.argv[2] ?? "preview@meritory.localhost";
const origin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const link = `${origin}/preview-link?token=not-a-real-token`;
const next = "new-address@meritory.localhost";

const mails: [MailKind, Mail][] = [
  ["verify-email", verifyEmail(to, link)],
  ["finish-sign-up", finishSignUp(to, link)],
  ["reset-password", resetPassword(to, link)],
  ["password-changed", passwordChanged(to, origin)],
  ["existing-account", existingAccount(to, origin)],
  ["provider-linked", providerLinked(to, "GitHub", origin)],
  ["provider-unlinked", providerUnlinked(to, "GitHub", origin)],
  ["approve-email-change", approveEmailChange(to, next, link, origin)],
  ["email-in-use", emailInUse(to, origin)],
  ["confirm-new-email", confirmNewEmail(to, link)],
  ["email-changed", emailChanged(to, next)],
  ["account-deleted", accountDeleted(to, origin)],
];

const mailer = createSmtpMailer(readSmtpConfig(process.env));
for (const [kind, mail] of mails) {
  await mailer.send(mail, { kind, userId: "preview" });
  console.log(`Sent ${kind}`);
}
