import { createHash } from "node:crypto";
import { eq, lte, sql } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { rateLimits } from "../db/schema.ts";

/** Wrong passwords allowed per email in the window, whatever the IP */
export const SIGN_IN_FAILURE_LIMIT = { windowSeconds: 15 * 60, max: 10 };

export const SIGN_IN_FAILURE_PREFIX = "sign-in-failures|";

/** At most one of each account notice per account in this window, whatever the IP */
export const NOTICE_GAP_SECONDS = 60;

export const NOTICE_PREFIX = "account-notice|";

// Only a hash is stored, so the table never holds an email
export const signInFailureKey = (email: string) =>
  `${SIGN_IN_FAILURE_PREFIX}${createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")}`;

/** Counts wrong passwords per email, in the same table as Better Auth's limiter */
export function createSignInFailures(db: Database["db"]) {
  const windowMs = SIGN_IN_FAILURE_LIMIT.windowSeconds * 1000;
  return {
    /** Seconds until the email can try again, or null when it can try now */
    async wait(email: string): Promise<number | null> {
      const now = Date.now();
      const [row] = await db
        .select({ count: rateLimits.count, since: rateLimits.lastRequest })
        .from(rateLimits)
        .where(eq(rateLimits.key, signInFailureKey(email)));
      if (!row || row.count < SIGN_IN_FAILURE_LIMIT.max) return null;
      if (row.since <= now - windowMs) return null;
      return Math.max(1, Math.ceil((row.since + windowMs - now) / 1000));
    },

    async record(email: string) {
      const now = Date.now();
      const expired = sql`${rateLimits.lastRequest} <= ${now - windowMs}`;
      // One statement, so failures at once all count
      await db
        .insert(rateLimits)
        .values({ key: signInFailureKey(email), count: 1, lastRequest: now })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
            lastRequest: sql`case when ${expired} then ${now} else ${rateLimits.lastRequest} end`,
          },
        });
    },

    async clear(email: string) {
      await db
        .delete(rateLimits)
        .where(eq(rateLimits.key, signInFailureKey(email)));
    },
  };
}

export type SignInFailures = ReturnType<typeof createSignInFailures>;

/** Spaces out the emails that tell an owner someone used their address */
export function createAccountNotices(db: Database["db"]) {
  return {
    /** True at most once per kind and account in the gap, and only then is the email sent */
    async claim(kind: string, userId: string): Promise<boolean> {
      const now = Date.now();
      // One statement, so two requests at once can't both claim it
      const claimed = await db
        .insert(rateLimits)
        .values({
          key: `${NOTICE_PREFIX}${kind}|${userId}`,
          count: 1,
          lastRequest: now,
        })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, lastRequest: now },
          setWhere: lte(
            rateLimits.lastRequest,
            now - NOTICE_GAP_SECONDS * 1000,
          ),
        })
        .returning({ id: rateLimits.id });
      return claimed.length > 0;
    },
  };
}

export type AccountNotices = ReturnType<typeof createAccountNotices>;
