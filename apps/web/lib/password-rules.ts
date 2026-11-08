import type { PasswordCheck } from "@meritory/password";

// The word lists are large, so they load on the first keystroke, not with the page
let passwordRules: Promise<typeof import("@meritory/password")> | undefined;
export const loadPasswordRules = () => {
  passwordRules ??= import("@meritory/password");
  return passwordRules;
};

/** What the strength meter says under a password field */
export function meterMessage(
  check: PasswordCheck | null,
  messages: Record<string, string>,
) {
  if (!check) return "Strength shows as you type";
  return check.problem === "personal"
    ? check.message
    : (messages[check.strength] ?? "");
}

/** Under a confirm field that doesn't match the new password */
export const MISMATCH = "These don't match. Check both and try again.";

/** Server codes that belong to the password field */
export const PASSWORD_CODES = new Set([
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "PASSWORD_PERSONAL",
  "PASSWORD_TOO_WEAK",
]);
