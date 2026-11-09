/** Wording and rules that the web and phone sign-in screens have to agree on */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_ERROR = "Enter an email like name@example.com";
export const NAME_ERROR = "Enter a name. A nickname is fine.";
export const PASSWORD_REQUIRED = "Enter your password.";

/** Under a confirm field that doesn't match the new password */
export const MISMATCH = "These don't match. Check both and try again.";

const FAILED = "Something went wrong on our side. Try again in a moment.";

export const SIGN_IN_MESSAGES = {
  // One message for both, so it never reveals which emails have accounts
  wrong: "That email and password don't match. Check them and try again.",
  offline: "You're offline. Signing in needs a connection.",
  failed: FAILED,
  unconfirmed: "Confirm your email first. We can send you a fresh link.",
};

export const SIGN_UP_MESSAGES = {
  offline: "You're offline. Creating an account needs a connection.",
  failed: FAILED,
};

type Notice = { tone: "info" | "danger" | "success"; text: string };

export const RESET_LINK_NOTICES = {
  // The same whether or not the email has an account
  sent: {
    tone: "info",
    text: "If that email has an account, we sent a link. It works for 1 hour.",
  },
  offline: {
    tone: "danger",
    text: "You're offline. Sending a link needs a connection.",
  },
  failed: { tone: "danger", text: FAILED },
} satisfies Record<string, Notice>;

export const RESEND_NOTICES = {
  sent: {
    tone: "success",
    text: "We sent a new link. The old one no longer works.",
  },
  offline: {
    tone: "info",
    text: "You're offline. Sending a new link needs a connection.",
  },
  limited: {
    tone: "info",
    text: "Too many tries. Wait a minute, then try again.",
  },
  failed: { tone: "info", text: FAILED },
} satisfies Record<string, Notice>;

/** Matches the server's limit of 3 sends a minute */
export const RESEND_WAIT_MS = 60_000;

/** Server codes that belong to the password field */
export const PASSWORD_CODES = new Set([
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "PASSWORD_PERSONAL",
  "PASSWORD_TOO_WEAK",
]);

/** Which sign-up field a server code belongs to */
export function signUpFieldFor(code: string | undefined) {
  if (!code) return undefined;
  if (code === "NAME_INVALID") return "name" as const;
  if (code === "INVALID_EMAIL") return "email" as const;
  return PASSWORD_CODES.has(code) ? ("password" as const) : undefined;
}

/** The rate limit message, using the wait the server sent in X-Retry-After */
export function waitMessage(retryAfter: string | null) {
  const seconds = Number(retryAfter);
  if (!retryAfter || !Number.isInteger(seconds) || seconds <= 0) {
    return "Too many tries. Wait a few seconds, then try again.";
  }
  const unit = seconds === 1 ? "second" : "seconds";
  return `Too many tries. Wait ${seconds} ${unit}, then try again.`;
}

/** What the strength meter says under a password field */
export function meterMessage(
  check: { strength: string; problem: string | null; message: string } | null,
  messages: Record<string, string>,
) {
  if (!check) return "Strength shows as you type";
  return check.problem === "personal"
    ? check.message
    : (messages[check.strength] ?? "");
}

/** Formats the wait before another link can be sent, like 1:05 */
export const countdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
