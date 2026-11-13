import { isAPIError } from "better-auth/api";
import Bowser from "bowser";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { rateLimits, sessions } from "../db/schema.ts";
import type { Auth } from "./auth.ts";

/** Ending sessions needs a sign-in or a typed password within this long */
export const CONFIRM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Typed passwords allowed per account in the window */
export const CONFIRM_LIMIT = { windowSeconds: 15 * 60, max: 5 };

export const CONFIRM_KEY_PREFIX = "confirm-password|";

export interface AccountSession {
  id: string;
  device: string;
  signedInAt: Date;
  /** Better Auth only touches this once a day, so it's day precision */
  lastActiveAt: Date;
}

export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "wrong_password" }
  | { ok: false; reason: "rate_limited"; retryAfter: number };

/** "Chrome on Windows", from the user agent saved at sign-in */
export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const parsed = Bowser.parse(userAgent);
  const browser = parsed.browser.name;
  const os = parsed.os.name;
  if (userAgent.startsWith("Meritory/")) {
    return os ? `Meritory app on ${os}` : "Meritory app";
  }
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || "Unknown device";
}

/** Who a request belongs to, for the API's own routes */
export function createSessionLookup(auth: Auth) {
  return async (headers: Headers) => {
    // Refreshing here would lose the new cookie, so clients refresh through /get-session
    const found = await auth.api.getSession({
      headers,
      query: { disableRefresh: true },
    });
    if (!found) return null;
    const { id, name, email } = found.user;
    return {
      user: { id, name, email },
      sessionId: found.session.id,
      fresh: isFresh(found.session),
    };
  };
}

/** Signed in, or confirmed the password, recently enough to end sessions */
export function isFresh(
  session: { createdAt: Date; confirmedAt?: Date | null },
  now = Date.now(),
): boolean {
  const last = Math.max(
    session.createdAt.getTime(),
    session.confirmedAt?.getTime() ?? 0,
  );
  return now - last < CONFIRM_MAX_AGE_MS;
}

export function createAccountSessions(db: Database["db"], auth: Auth) {
  // Counts every try, right or wrong, so guessing stays slow
  async function consume(key: string): Promise<number | null> {
    const now = Date.now();
    const windowMs = CONFIRM_LIMIT.windowSeconds * 1000;
    const expired = sql`${rateLimits.lastRequest} <= ${now - windowMs}`;
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, lastRequest: now })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
          lastRequest: sql`case when ${expired} then ${now} else ${rateLimits.lastRequest} end`,
        },
      })
      .returning();
    if (!row || row.count <= CONFIRM_LIMIT.max) return null;
    return Math.max(1, Math.ceil((row.lastRequest + windowMs - now) / 1000));
  }

  return {
    async list(userId: string): Promise<AccountSession[]> {
      const rows = await db
        .select({
          id: sessions.id,
          userAgent: sessions.userAgent,
          createdAt: sessions.createdAt,
          updatedAt: sessions.updatedAt,
        })
        .from(sessions)
        .where(
          and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())),
        )
        .orderBy(desc(sessions.updatedAt));
      return rows.map((row) => ({
        id: row.id,
        device: deviceLabel(row.userAgent),
        signedInAt: row.createdAt,
        lastActiveAt: row.updatedAt,
      }));
    },

    /** False when the session is gone or belongs to someone else */
    async end(userId: string, sessionId: string): Promise<boolean> {
      const ended = await db
        .delete(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
        .returning({ id: sessions.id });
      return ended.length > 0;
    },

    async endOthers(userId: string, keepId: string): Promise<number> {
      const ended = await db
        .delete(sessions)
        .where(and(eq(sessions.userId, userId), ne(sessions.id, keepId)))
        .returning({ id: sessions.id });
      return ended.length;
    },

    /** Checks the password and marks this session as confirmed */
    async confirmPassword(input: {
      userId: string;
      sessionId: string;
      password: string;
      headers: Headers;
    }): Promise<ConfirmResult> {
      const retryAfter = await consume(`${CONFIRM_KEY_PREFIX}${input.userId}`);
      if (retryAfter !== null) {
        return { ok: false, reason: "rate_limited", retryAfter };
      }
      try {
        await auth.api.verifyPassword({
          body: { password: input.password },
          headers: input.headers,
        });
      } catch (err) {
        if (isAPIError(err) && err.status === "BAD_REQUEST") {
          return { ok: false, reason: "wrong_password" };
        }
        throw err;
      }
      await db
        .update(sessions)
        .set({ confirmedAt: new Date() })
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.userId, input.userId),
          ),
        );
      return { ok: true };
    },
  };
}

export type AccountSessions = ReturnType<typeof createAccountSessions>;
