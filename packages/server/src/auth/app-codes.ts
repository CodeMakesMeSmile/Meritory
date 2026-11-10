import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { verifications } from "../db/schema.ts";

/**
 * The phone app gets a one-time code in its link instead of the session, because other
 * apps can claim the same scheme. Only the app that started sign-in holds the verifier
 * that redeems it (PKCE, RFC 7636).
 */
export const APP_CODE_PREFIX = "app-code:";

export const APP_CODE_LIFETIME_SECONDS = 60;

/** An S256 challenge is base64url SHA-256, which is always 43 characters without padding */
const CHALLENGE = /^[\w-]{43}$/;

export function isChallenge(value: unknown): value is string {
  return typeof value === "string" && CHALLENGE.test(value);
}

export function s256(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

const stored = (code: string) =>
  `${APP_CODE_PREFIX}${createHash("sha256").update(code).digest("hex")}`;

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface AppCodes {
  /** A fresh code for this session, which only the challenge's verifier redeems */
  issue(sessionToken: string, challenge: string): Promise<string>;
  /** The session token, or null. Any attempt uses the code up. */
  redeem(code: string, verifier: string): Promise<string | null>;
}

export function createAppCodes(db: Database["db"]): AppCodes {
  return {
    async issue(sessionToken, challenge) {
      const code = randomBytes(32).toString("base64url");
      await db.insert(verifications).values({
        identifier: stored(code),
        value: JSON.stringify({ sessionToken, challenge }),
        expiresAt: new Date(Date.now() + APP_CODE_LIFETIME_SECONDS * 1000),
      });
      return code;
    },

    async redeem(code, verifier) {
      // Deleting first means two requests with the same code can't both get it
      const [row] = await db
        .delete(verifications)
        .where(eq(verifications.identifier, stored(code)))
        .returning({
          value: verifications.value,
          expiresAt: verifications.expiresAt,
        });
      if (!row || row.expiresAt <= new Date()) return null;
      const { sessionToken, challenge } = JSON.parse(row.value) as {
        sessionToken: string;
        challenge: string;
      };
      return sameText(s256(verifier), challenge) ? sessionToken : null;
    },
  };
}
