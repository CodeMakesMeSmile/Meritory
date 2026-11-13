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
