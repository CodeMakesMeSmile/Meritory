import { randomInt, randomUUID } from "node:crypto";
import { like, or } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { rateLimits, users } from "../db/schema.ts";
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

  const signIn = (ip: string, password: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ email: owner, password }),
      }),
    );

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

  afterAll(async () => {
    await db
      .delete(rateLimits)
      .where(or(...ips.map((ip) => like(rateLimits.key, `${ip}|%`))));
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
});
