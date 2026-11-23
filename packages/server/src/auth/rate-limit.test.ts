import { randomInt, randomUUID } from "node:crypto";
import { ATTACKS } from "@meritory/security-testing";
import { eq, inArray, like, or } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { rateLimits, users } from "../db/schema.ts";
import { SIGN_IN_FAILURE_LIMIT, signInFailureKey } from "./account-limits.ts";
import { APP_SESSION_LIMIT, createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const PASSWORD = "violet harbor tractor sandwich";
const ORIGIN = "https://meritory.test";

// A fresh address each run, so earlier runs and other test files never share a bucket
const freshIp = () =>
  `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

describe.skipIf(!url)("sign-in rate limit against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer: { send: async () => {} },
    log: { error: () => {} },
    ipAddressHeaders: ["x-forwarded-for"],
  });

  const owner = `rate-limit-${randomUUID()}@meritory.test`;
  const ips: string[] = [];

  const signIn = (ip: string, password: string, email = owner) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ email, password }),
      }),
    );

  // Emails whose wrong passwords this file counted
  const counted = [owner];

  const nextIp = () => {
    const ip = freshIp();
    ips.push(ip);
    return ip;
  };

  beforeAll(async () => {
    const response = await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({
          name: "Owner",
          email: owner,
          password: PASSWORD,
        }),
      }),
    );
    expect(response.status).toBe(200);
  });

  // Each test starts the owner's wrong password count from zero
  beforeEach(async () => {
    await db
      .delete(rateLimits)
      .where(eq(rateLimits.key, signInFailureKey(owner)));
  });

  afterAll(async () => {
    await db
      .delete(rateLimits)
      .where(or(...ips.map((ip) => like(rateLimits.key, `${ip}|%`))));
    await db
      .delete(rateLimits)
      .where(inArray(rateLimits.key, counted.map(signInFailureKey)));
    await db
      .delete(users)
      .where(like(users.email, "rate-limit-%@meritory.test"));
    await database.close();
  });

  it("refuses the fourth try in 10 seconds and says when to retry", async () => {
    const ip = nextIp();
    for (let i = 0; i < 3; i++) {
      expect((await signIn(ip, "wrong password guess")).status).toBe(401);
    }

    const blocked = await signIn(ip, "wrong password guess");
    expect(blocked.status).toBe(429);
    const retry = Number(blocked.headers.get("x-retry-after"));
    expect(retry).toBeGreaterThan(0);
    expect(retry).toBeLessThanOrEqual(10);
  });

  it("refuses the right password once the limit is hit", async () => {
    const ip = nextIp();
    for (let i = 0; i < 3; i++) {
      await signIn(ip, "wrong password guess");
    }

    // An unconfirmed email gets 403 when the limiter lets it through
    expect((await signIn(ip, PASSWORD)).status).toBe(429);
  });

  it("keeps a separate count for each address", async () => {
    const blocked = nextIp();
    for (let i = 0; i < 4; i++) {
      await signIn(blocked, "wrong password guess");
    }

    expect((await signIn(nextIp(), "wrong password guess")).status).toBe(401);
  });

  it("refuses an account's sign-in after 10 wrong passwords from any address", async () => {
    for (let i = 0; i < SIGN_IN_FAILURE_LIMIT.max; i++) {
      expect((await signIn(nextIp(), "wrong password guess")).status).toBe(401);
    }
    for (const password of ["wrong password guess", PASSWORD]) {
      const blocked = await signIn(nextIp(), password);
      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toEqual({
        message: "Too many requests. Please try again later.",
      });
      const retry = Number(blocked.headers.get("x-retry-after"));
      expect(retry).toBeGreaterThan(10 * 60);
      expect(retry).toBeLessThanOrEqual(SIGN_IN_FAILURE_LIMIT.windowSeconds);
    }
    // Another account isn't held up
    const other = `rate-limit-other-${randomUUID()}@meritory.test`;
    counted.push(other);
    expect((await signIn(nextIp(), "wrong guess", other)).status).toBe(401);
  });

  it("counts the email in any case as one account", async () => {
    for (let i = 0; i < SIGN_IN_FAILURE_LIMIT.max; i++) {
      const email = i % 2 ? owner.toUpperCase() : owner;
      await signIn(nextIp(), "wrong password guess", email);
    }
    expect((await signIn(nextIp(), "wrong password guess")).status).toBe(429);
  });

  it("answers an unknown email the same way", async () => {
    const unknown = `rate-limit-nobody-${randomUUID()}@meritory.test`;
    counted.push(unknown);
    for (let i = 0; i < SIGN_IN_FAILURE_LIMIT.max; i++) {
      const res = await signIn(nextIp(), "wrong password guess", unknown);
      expect(res.status).toBe(401);
    }
    const blocked = await signIn(nextIp(), "wrong password guess", unknown);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("x-retry-after"))).toBeGreaterThan(0);
  });

  it("starts the count again after a right password", async () => {
    // An unconfirmed email still means the password was right
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, owner));
    for (let i = 0; i < SIGN_IN_FAILURE_LIMIT.max - 1; i++) {
      await signIn(nextIp(), "wrong password guess");
    }
    expect((await signIn(nextIp(), PASSWORD)).status).toBe(200);
    for (let i = 0; i < SIGN_IN_FAILURE_LIMIT.max - 1; i++) {
      expect((await signIn(nextIp(), "wrong password guess")).status).toBe(401);
    }
    await db
      .update(users)
      .set({ emailVerified: false })
      .where(eq(users.email, owner));
  });

  it.each(ATTACKS)("counts the email %j without trouble", async (email) => {
    const res = await signIn(nextIp(), "wrong password guess", email);
    expect([400, 401]).toContain(res.status);
    counted.push(email);
  });

  it("refuses the eleventh code trade from the app in a minute", async () => {
    const ip = nextIp();
    const trade = () =>
      auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/app-session`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "expo-origin": "app.meritory.mobile://",
            "x-forwarded-for": ip,
          },
          body: JSON.stringify({
            code: "A".repeat(43),
            verifier: "B".repeat(43),
          }),
        }),
      );
    for (let i = 0; i < APP_SESSION_LIMIT.max; i++) {
      expect((await trade()).status).toBe(401);
    }
    expect((await trade()).status).toBe(429);
  });

  it("counts a forged address against the real one behind trusted proxies", async () => {
    const proxy = "192.0.2.10";
    const proxied = createAuth({
      db,
      secret: "x".repeat(32),
      baseUrl: `${ORIGIN}/api/v1/auth`,
      webOrigin: ORIGIN,
      appScheme: "app.meritory.mobile://",
      mailer: { send: async () => {} },
      log: { error: () => {} },
      trustedProxies: [proxy],
    });
    const client = nextIp();
    const attempt = () =>
      proxied.handler(
        new Request(`${ORIGIN}/api/v1/auth/sign-in/email`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            "x-forwarded-for": `${freshIp()}, ${client}, ${proxy}`,
          },
          body: JSON.stringify({ email: owner, password: "wrong guess" }),
        }),
      );
    for (let i = 0; i < 3; i++) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });
});
