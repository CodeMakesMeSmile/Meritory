import { and, like, lt, lte, or } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { rateLimits, verifications } from "../db/schema.ts";
import {
  NOTICE_GAP_SECONDS,
  NOTICE_PREFIX,
  SIGN_IN_FAILURE_LIMIT,
  SIGN_IN_FAILURE_PREFIX,
} from "./account-limits.ts";
import { APP_CODE_PREFIX } from "./app-codes.ts";

/** How often the worker clears out rows that can no longer count */
export const PURGE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Removes sign-in failure counts and notice gaps whose window has passed, and
 * app codes that expired unused. Each is only deleted when it's used, so one
 * that's never used again would stay, and a notice gap holds a user id.
 */
export async function purgeExpired(db: Database["db"], now = new Date()) {
  const time = now.getTime();
  const limits = await db
    .delete(rateLimits)
    .where(
      or(
        and(
          like(rateLimits.key, `${SIGN_IN_FAILURE_PREFIX}%`),
          lte(
            rateLimits.lastRequest,
            time - SIGN_IN_FAILURE_LIMIT.windowSeconds * 1000,
          ),
        ),
        and(
          like(rateLimits.key, `${NOTICE_PREFIX}%`),
          lte(rateLimits.lastRequest, time - NOTICE_GAP_SECONDS * 1000),
        ),
      ),
    )
    .returning({ id: rateLimits.id });
  const codes = await db
    .delete(verifications)
    .where(
      and(
        like(verifications.identifier, `${APP_CODE_PREFIX}%`),
        lt(verifications.expiresAt, now),
      ),
    )
    .returning({ id: verifications.id });
  return { limits: limits.length, codes: codes.length };
}
