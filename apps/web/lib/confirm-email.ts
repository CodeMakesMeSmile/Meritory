import { FAILED_URL } from "./email-change";

/** A sign-up confirmation, or the last step of an email change */
export type ConfirmKind = "sign-up" | "change";

export const CONFIRMED_URL = "/email-confirmed";
export const EXPIRED_URL = `${CONFIRMED_URL}?error=INVALID_TOKEN`;
const CHANGED_URL = "/account?email=changed";

/** Where a link that can't work sends the browser */
export const failedUrl = (kind: ConfirmKind) =>
  kind === "change" ? FAILED_URL : EXPIRED_URL;

const CONFIRM_OFFLINE = "You're offline. Confirming needs a connection.";
const CONFIRM_FAILED =
  "Something went wrong on our side. Try again in a moment.";

/** Where to go next, or what to say while the button stays */
export type ConfirmOutcome = { next: string } | { message: string };

/** The press on the confirm page, so a mail scanner opening the link confirms nothing */
export async function confirmEmail(
  token: string,
  kind: ConfirmKind,
): Promise<ConfirmOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/v1/auth/confirm-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ token }),
    });
  } catch {
    return { message: CONFIRM_OFFLINE };
  }
  if (res.ok) return { next: kind === "change" ? CHANGED_URL : CONFIRMED_URL };
  // A used, expired, or unknown token can't work on a second press
  if (res.status >= 400 && res.status < 500 && res.status !== 429) {
    return { next: failedUrl(kind) };
  }
  return { message: CONFIRM_FAILED };
}
