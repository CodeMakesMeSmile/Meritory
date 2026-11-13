import { and, eq, like, or } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { rateLimits, users, verifications } from "../db/schema.ts";
import type { Mailer } from "../mail/mailer.ts";
import { CONFIRM_KEY_PREFIX } from "./account-sessions.ts";
import type { Auth, AuthLogger } from "./auth.ts";
import { RESET_PREFIX } from "./reset-links.ts";

export interface AccountDeletion {
  /** Set-Cookie values that clear the session in this browser */
  delete(userId: string): Promise<{ cookies: string[] }>;
}

interface AccountDeletionConfig {
  db: Database["db"];
  auth: Auth;
  mailer: Mailer;
  webOrigin: string;
  log: AuthLogger;
}

interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

/** An expired copy of the cookie, with the same scope so the browser drops it */
export function clearCookie(name: string, options: CookieOptions) {
  return [
    `${name}=`,
    `Path=${options.path ?? "/"}`,
    "Max-Age=0",
    ...(options.httpOnly ? ["HttpOnly"] : []),
    ...(options.secure ? ["Secure"] : []),
    ...(options.sameSite ? [`SameSite=${options.sameSite}`] : []),
  ].join("; ");
}

export function createAccountDeletion({
  db,
  auth,
  mailer,
  webOrigin,
  log,
}: AccountDeletionConfig): AccountDeletion {
  return {
    async delete(userId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId));
      if (!user) return { cookies: [] };

      // Queued emails would carry links into an account that's gone
      await mailer.forget?.(userId);
      await db.transaction(async (tx) => {
        await tx
          .delete(verifications)
          .where(
            or(
              eq(verifications.identifier, `email-link:${userId}`),
              and(
                like(verifications.identifier, `${RESET_PREFIX}%`),
                eq(verifications.value, userId),
              ),
            ),
          );
        await tx
          .delete(rateLimits)
          .where(eq(rateLimits.key, `${CONFIRM_KEY_PREFIX}${userId}`));
        // Sessions, sign-in methods, and unlink records go with the user
        await tx.delete(users).where(eq(users.id, userId));
      });

      mailer
        .send(
          {
            to: user.email,
            subject: "Your Meritory account was deleted",
            text: [
              "Your Meritory account and everything in it were deleted, and every device was signed out.",
              "If this was you, there's nothing else to do.",
              `You can sign up again with this email at any time, as a new account: ${webOrigin}/sign-up`,
            ].join("\n\n"),
          },
          { kind: "account-deleted", userId },
        )
        .catch((err: unknown) =>
          log.error({ err, kind: "account-deleted", userId }, "email failed"),
        );

      const { authCookies } = await auth.$context;
      const cookies = [
        authCookies.sessionToken,
        authCookies.sessionData,
        authCookies.dontRememberToken,
      ].map(({ name, attributes }) => clearCookie(name, attributes));
      return { cookies };
    },
  };
}
