/** Where email change links open, with ?email= saying how it went */
export const EMAIL_CHANGE_PATH = "/account";

export type EmailChangeStep = "approved" | "changed" | "failed";

export const emailChangePath = (step: EmailChangeStep) =>
  `${EMAIL_CHANGE_PATH}?email=${step}`;

export interface ChangeLink {
  /** The address the account had when the change was asked for */
  from: string;
  to: string;
  userId: string;
  /** The new address's link, which finishes the change */
  finishes: boolean;
}

/**
 * Reads an email change link without checking its signature, so it only picks
 * where to send people. Better Auth checks the signature, and the link must
 * also match one we sent.
 */
export function readChangeLink(token: string): ChangeLink | null {
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    );
    if (typeof payload !== "object" || payload === null) return null;
    const { email, updateTo, userId, requestType } = payload as Record<
      string,
      unknown
    >;
    if (
      typeof email !== "string" ||
      typeof updateTo !== "string" ||
      typeof userId !== "string"
    ) {
      return null;
    }
    return {
      from: email,
      to: updateTo,
      userId,
      finishes: requestType === "change-email-verification",
    };
  } catch {
    return null;
  }
}
