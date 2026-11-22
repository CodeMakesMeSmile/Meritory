import { renderEmail } from "./email-layout.ts";
import type { Mail } from "./mailer.ts";

const IF_NOT_YOU =
  "If this was you, there's nothing else to do. If it wasn't you, reset your password now.";

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

export function finishSignUp(to: string, url: string): Mail {
  return renderEmail({
    to,
    subject: "Finish signing up for Meritory",
    heading: "Choose your password",
    blocks: [
      {
        text: "Someone started signing up for Meritory with this email. To finish, choose your password. The link works for 1 hour.",
      },
      { button: "Choose your password", url },
      { note: "If this wasn't you, you can ignore this email." },
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
      { text: IF_NOT_YOU },
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
      {
        note: "If this wasn't you, you can ignore this email. Nothing about your account has changed.",
      },
    ],
  });
}

export function providerLinked(
  to: string,
  provider: string,
  origin: string,
): Mail {
  return renderEmail({
    to,
    subject: `${provider} was added to your Meritory account`,
    heading: `${provider} was added to your account`,
    blocks: [
      { text: `${provider} can now sign you in to Meritory.` },
      { text: IF_NOT_YOU },
      { link: "Reset your password", url: `${origin}/forgot-password` },
    ],
  });
}

export function providerUnlinked(
  to: string,
  provider: string,
  origin: string,
): Mail {
  return renderEmail({
    to,
    subject: `${provider} was removed from your Meritory account`,
    heading: `${provider} was removed from your account`,
    blocks: [
      { text: `${provider} can no longer sign you in to Meritory.` },
      { text: IF_NOT_YOU },
      { link: "Reset your password", url: `${origin}/forgot-password` },
    ],
  });
}

export function approveEmailChange(
  to: string,
  newEmail: string,
  url: string,
  origin: string,
): Mail {
  return renderEmail({
    to,
    subject: "Approve your new email for Meritory",
    heading: "Approve your new email",
    blocks: [
      {
        text: `Someone asked to change the email on your Meritory account to ${newEmail}.`,
      },
      {
        text: "If it was you, approve it. The link works for 1 hour. Then we send a link to the new address to finish.",
      },
      { button: "Approve change", url },
      {
        note: "If it wasn't you, don't open the link, and your email stays the same. Reset your password to be safe.",
      },
      { link: "Reset your password", url: `${origin}/forgot-password` },
    ],
  });
}

export function emailInUse(to: string, origin: string): Mail {
  return renderEmail({
    to,
    subject: "Someone tried to use your email on Meritory",
    heading: "Someone tried to use your email",
    blocks: [
      {
        text: "Someone tried to move another Meritory account to this email, but it already belongs to your account.",
      },
      { text: "If that was you, sign in with this email instead." },
      { link: "Sign in", url: `${origin}/sign-in` },
      {
        note: "If it wasn't you, you can ignore this email. Nothing about your account has changed.",
      },
    ],
  });
}

export function confirmNewEmail(to: string, url: string): Mail {
  return renderEmail({
    to,
    subject: "Confirm your new email for Meritory",
    heading: "Confirm your new email",
    blocks: [
      {
        text: "Open this link to finish moving your Meritory account to this email. The link works for 1 hour.",
      },
      { button: "Confirm new email", url },
      { note: "If you didn't ask for this, you can ignore this email." },
    ],
  });
}

export function emailChanged(to: string, newEmail: string): Mail {
  return renderEmail({
    to,
    subject: "Your Meritory email was changed",
    heading: "Your email was changed",
    blocks: [
      {
        text: `The email for your Meritory account is now ${newEmail}, and your other devices were signed out.`,
      },
      { text: "If this was you, there's nothing else to do." },
      {
        text: "If it wasn't you, someone could read this inbox, because the change was approved from it. Secure this email account first.",
      },
    ],
  });
}

export function accountDeleted(to: string, origin: string): Mail {
  return renderEmail({
    to,
    subject: "Your Meritory account was deleted",
    heading: "Your account was deleted",
    blocks: [
      {
        text: "Your Meritory account and everything in it were deleted, and every device was signed out.",
      },
      {
        text: "If this was you, there's nothing else to do. You can sign up again with this email at any time, as a new account.",
      },
      { link: "Sign up", url: `${origin}/sign-up` },
    ],
  });
}
