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

export const PROVIDER_IDS = ["github", "google"] as const;
export type Provider = (typeof PROVIDER_IDS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  github: "GitHub",
  google: "Google",
};

export function isProvider(value: unknown): value is Provider {
  return PROVIDER_IDS.includes(value as Provider);
}

export interface ProviderNotice {
  tone: "info" | "danger";
  text: string;
  /** Offer the reset, which confirms an account that isn't confirmed */
  reset?: boolean;
}

type LinkValue = string | string[] | null | undefined;

/** What to say when a provider was just added to the account */
export function linkedText(linked: LinkValue) {
  if (!isProvider(linked)) return null;
  return `${PROVIDER_LABELS[linked]} is now linked to your account. You can sign in with it too.`;
}

/** What to say when GitHub or Google sends someone back with an error */
export function providerNotice(
  provider: LinkValue,
  error: LinkValue,
  page: "sign-in" | "account" = "sign-in",
  email = "your Meritory email",
): ProviderNotice | null {
  if (typeof error !== "string" || !isProvider(provider)) return null;
  const label = PROVIDER_LABELS[provider];
  switch (error) {
    case "access_denied":
      return {
        tone: "info",
        text:
          page === "account"
            ? `You cancelled on ${label}. Nothing changed.`
            : `You cancelled signing in with ${label}. Nothing was created.`,
      };
    case "email_does_not_match":
      return {
        tone: "danger",
        text: `That ${label} account uses a different email. Link one that uses ${email}.`,
      };
    case "account_already_linked_to_different_user":
      return {
        tone: "danger",
        text: `That ${label} account already belongs to another Meritory account. Sign in with it there and unlink it first.`,
      };
    case "provider_unlinked":
      return {
        tone: "info",
        text: `${label} was unlinked from this account. Sign in another way, then link it again from Account.`,
      };
    case "email_not_found":
    case "email_not_verified":
      return {
        tone: "danger",
        text: `Your ${label} account has no verified email. Verify one on ${label}, then try again.`,
      };
    case "account_not_linked":
      return {
        tone: "info",
        text: `There's already an account with this email that isn't confirmed. Reset its password to confirm it, then continue with ${label}.`,
        reset: true,
      };
    default:
      return {
        tone: "danger",
        text: `${label} sign-in didn't work. Try again.`,
      };
  }
}
