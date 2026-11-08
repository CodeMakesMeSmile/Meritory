import { createHash } from "node:crypto";
import { and, eq, gt, like, ne, sql } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { verifications } from "../db/schema.ts";

/** Better Auth stores each reset link under this prefix, with the user ID as the value */
export const RESET_PREFIX = "reset-password:";

/** At most one reset email per account in this window, whatever the IP */
export const RESET_EMAIL_GAP_SECONDS = 60;

/**
 * Better Auth's `verification.storeIdentifier` hook. Only a hash of the token
 * is stored, so a database leak can't reset anyone's password. The prefix
 * stays readable so the account's links can be found and cancelled.
 */
export async function hashResetIdentifier(identifier: string) {
  const token = identifier.slice(RESET_PREFIX.length);
  return `${RESET_PREFIX}${createHash("sha256").update(token).digest("hex")}`;
}

export interface ResetLinks {
  /**
   * Called once Better Auth has stored a new link. False when the account
   * already got one in the last minute, in which case the new link is dropped
   * and no email should go out. Otherwise every older link is cancelled.
   */
  claim(userId: string, token: string): Promise<boolean>;
  /** Cancels every reset link the account has */
  revokeAll(userId: string): Promise<void>;
}

const forUser = (userId: string) =>
  and(
    like(verifications.identifier, `${RESET_PREFIX}%`),
    eq(verifications.value, userId),
  );

export function createResetLinks(db: Database["db"]): ResetLinks {
  return {
    async claim(userId, token) {
      const current = await hashResetIdentifier(`${RESET_PREFIX}${token}`);
      const since = new Date(Date.now() - RESET_EMAIL_GAP_SECONDS * 1000);
      return db.transaction(async (tx) => {
        // Two requests at once take turns, so exactly one email goes out
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`reset:${userId}`}))`,
        );
        const others = and(
          forUser(userId),
          ne(verifications.identifier, current),
        );
        const recent = await tx
          .select({ id: verifications.id })
          .from(verifications)
          .where(and(others, gt(verifications.createdAt, since)))
          .limit(1);
        if (recent.length > 0) {
          await tx
            .delete(verifications)
            .where(eq(verifications.identifier, current));
          return false;
        }
        await tx.delete(verifications).where(others);
        return true;
      });
    },

    async revokeAll(userId) {
      await db.delete(verifications).where(forUser(userId));
    },
  };
}
