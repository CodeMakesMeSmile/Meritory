import { renderEmail } from "./email-layout.ts";
import type { Mail } from "./mailer.ts";

const NOTHING_CHANGED =
  "If this wasn't you, you can ignore this email. Nothing about your account has changed.";

export function verifyEmail(to: string, url: string): Mail {
  return renderEmail({
    to,
    subject: "Confirm your email for Meritory",
    heading: "Confirm your email",
    blocks: [
      { text: "Finish signing up for Meritory. The link works for 1 hour." },
      { button: "Confirm email", url },
      { note: "If you didn't sign up, you can ignore this email." },
    ],
  });
}

export function resetPassword(to: string, url: string): Mail {
  return renderEmail({
    to,
    subject: "Reset your Meritory password",
    heading: "Reset your password",
    blocks: [
      {
        text: "Someone asked to reset the password for your Meritory account. The link works for 1 hour.",
      },
      { button: "Choose a new password", url },
      {
        note: "Saving a new password signs out your other devices. If this wasn't you, you can ignore this email.",
      },
    ],
  });
}

export function passwordChanged(to: string, origin: string): Mail {
  return renderEmail({
    to,
    subject: "Your Meritory password was changed",
    heading: "Your password was changed",
    blocks: [
      {
        text: "The password for your Meritory account was just changed, and your other devices were signed out.",
      },
      {
        text: "If this was you, there's nothing else to do. If it wasn't you, reset your password now.",
      },
      { link: "Reset your password", url: `${origin}/forgot-password` },
    ],
  });
}

export function existingAccount(to: string, origin: string): Mail {
  return renderEmail({
    to,
    subject: "Someone tried to sign up with your email",
    heading: "You already have an account",
    blocks: [
      {
        text: "Someone tried to create a Meritory account with this email, but you already have one.",
      },
      { link: "Sign in", url: `${origin}/sign-in` },
      { link: "Reset your password", url: `${origin}/forgot-password` },
      { note: NOTHING_CHANGED },
    ],
  });
}
