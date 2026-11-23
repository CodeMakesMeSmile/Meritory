/** Where an email change link left off, from the ?email= the server adds */
export type EmailStep = "approved" | "changed" | "failed";

const STEPS: readonly string[] = ["approved", "changed", "failed"];

/** Any ?error= next to it means Better Auth refused the link */
export function emailStep(email: unknown, error: unknown): EmailStep | null {
  if (typeof email !== "string" || !STEPS.includes(email)) return null;
  return error === undefined ? (email as EmailStep) : "failed";
}

export const FAILED_LINK =
  "That link didn't work, so your email hasn't changed. Links work once, for 1 hour. Use Change email to start again.";

/** What Account says after an emailed link opens it */
export function stepNotice(step: EmailStep, email: string) {
  if (step === "approved") {
    return {
      tone: "info",
      text: "Change approved. Now open the link we sent to your new address. It works for 1 hour.",
    } as const;
  }
  if (step === "changed") {
    return {
      tone: "success",
      text: `Your email is now ${email}. Your other devices were signed out.`,
    } as const;
  }
  return { tone: "danger", text: FAILED_LINK } as const;
}

export const sentNotice = (email: string) =>
  ({
    tone: "info",
    text: `Check ${email} for a link to approve the change. It works for 1 hour.`,
  }) as const;

/** Account, showing where the change left off */
const stepUrl = (step: EmailStep) => `/account?email=${step}`;
export const APPROVED_URL = stepUrl("approved");
export const FAILED_URL = stepUrl("failed");

const APPROVE_OFFLINE = "You're offline. Approving needs a connection.";
const APPROVE_FAILED =
  "Something went wrong on our side. Try again in a moment.";

/** Where to go next, or what to say while the button stays */
export type ApproveOutcome = { next: string } | { message: string };

/** The press on the approve page, so a mail scanner opening the link changes nothing */
export async function approveEmailChange(
  token: string,
): Promise<ApproveOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/v1/auth/approve-email-change", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ token }),
    });
  } catch {
    return { message: APPROVE_OFFLINE };
  }
  if (res.ok) return { next: APPROVED_URL };
  // A used, expired, or unknown token can't work on a second press
  if (res.status >= 400 && res.status < 500 && res.status !== 429) {
    return { next: FAILED_URL };
  }
  return { message: APPROVE_FAILED };
}
