import { randomUUID } from "node:crypto";
import { inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { rateLimits, verifications } from "../db/schema.ts";
import {
  NOTICE_GAP_SECONDS,
  NOTICE_PREFIX,
  SIGN_IN_FAILURE_LIMIT,
  SIGN_IN_FAILURE_PREFIX,
} from "./account-limits.ts";
import { APP_CODE_PREFIX } from "./app-codes.ts";
import { purgeExpired } from "./purge.ts";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("purge against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const run = randomUUID();
  const now = new Date("2026-11-22T12:00:00.000Z");
  const ago = (seconds: number) => now.getTime() - seconds * 1000;

  const keys = {
    oldFailure: `${SIGN_IN_FAILURE_PREFIX}${run}-old`,
    freshFailure: `${SIGN_IN_FAILURE_PREFIX}${run}-fresh`,
    oldNotice: `${NOTICE_PREFIX}existing-account|${run}-old`,
    freshNotice: `${NOTICE_PREFIX}existing-account|${run}-fresh`,
    // Better Auth's own limiter rows, which it manages itself
    other: `${run}|/sign-in/email`,
  };
  const codes = {
    expired: `${APP_CODE_PREFIX}${run}-expired`,
    live: `${APP_CODE_PREFIX}${run}-live`,
    // Another kind of link, past its time, which isn't ours to remove
    other: `reset-password:${run}`,
  };

  afterAll(async () => {
    await db
      .delete(rateLimits)
      .where(inArray(rateLimits.key, Object.values(keys)));
    await db
      .delete(verifications)
      .where(like(verifications.identifier, `%${run}%`));
    await database.close();
  });

  it("removes only our own rows whose time has passed", async () => {
    const window = SIGN_IN_FAILURE_LIMIT.windowSeconds;
    await db.insert(rateLimits).values([
      { key: keys.oldFailure, count: 3, lastRequest: ago(window + 1) },
      { key: keys.freshFailure, count: 3, lastRequest: ago(window - 60) },
      { key: keys.oldNotice, count: 1, lastRequest: ago(NOTICE_GAP_SECONDS) },
      { key: keys.freshNotice, count: 1, lastRequest: ago(5) },
      { key: keys.other, count: 1, lastRequest: ago(window * 10) },
    ]);
    await db.insert(verifications).values([
      { identifier: codes.expired, value: "{}", expiresAt: new Date(ago(1)) },
      { identifier: codes.live, value: "{}", expiresAt: new Date(ago(-30)) },
      { identifier: codes.other, value: "x", expiresAt: new Date(ago(3600)) },
    ]);

    const removed = await purgeExpired(db, now);
    expect(removed.limits).toBeGreaterThanOrEqual(2);
    expect(removed.codes).toBeGreaterThanOrEqual(1);

    const left = await db
      .select({ key: rateLimits.key })
      .from(rateLimits)
      .where(inArray(rateLimits.key, Object.values(keys)));
    expect(left.map((row) => row.key).sort()).toEqual(
      [keys.freshFailure, keys.freshNotice, keys.other].sort(),
    );
    const kept = await db
      .select({ identifier: verifications.identifier })
      .from(verifications)
      .where(like(verifications.identifier, `%${run}%`));
    expect(kept.map((row) => row.identifier).sort()).toEqual(
      [codes.live, codes.other].sort(),
    );
  });
});
