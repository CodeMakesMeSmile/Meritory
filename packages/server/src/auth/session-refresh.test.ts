import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { sessions, users } from "../db/schema.ts";
import { createSessionLookup } from "./account-sessions.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const DAY = 24 * 60 * 60 * 1000;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

describe.skipIf(!url)("keeping a session going", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "meritory://",
    mailer: { send: async () => {} },
    log: { error: () => {} },
    rateLimit: false,
  });
  const lookup = createSessionLookup(auth);

  const post = (path: string, body: object) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify(body),
      }),
    );

  const getSessionRoute = (cookie: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/get-session`, {
        headers: { cookie, origin: ORIGIN },
      }),
    );

  const sessionCookie = (res: Response) =>
    res.headers
      .getSetCookie()
      .find((cookie) => cookie.includes("better-auth.session_token="));

  const signedIn = async () => {
    const email = `refresh-${randomUUID()}@meritory.test`;
    await post("/sign-up/email", { name: "Rowan", email, password: PASSWORD });
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));
    const res = await post("/sign-in/email", { email, password: PASSWORD });
    const cookie = sessionCookie(res)?.split(";")[0];
    if (!cookie) throw new Error("no session cookie");
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (!user) throw new Error("no user");
    return { cookie, userId: user.id };
  };

  /** Puts the expiry where it would be this many days after sign-in */
  const age = (userId: string, days: number) =>
    db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + 7 * DAY - days * DAY) })
      .where(eq(sessions.userId, userId));

  const expiryOf = async (userId: string) => {
    const [row] = await db
      .select({ expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.userId, userId));
    if (!row) throw new Error("no session");
    return row.expiresAt.getTime();
  };

  afterAll(async () => {
    await db.delete(users).where(like(users.email, "refresh-%@meritory.test"));
    await database.close();
  });

  it("leaves the expiry alone when the API checks a session", async () => {
    const { cookie, userId } = await signedIn();
    await age(userId, 2);
    const before = await expiryOf(userId);

    const found = await lookup(new Headers({ cookie }));

    expect(found?.user.id).toBe(userId);
    expect(await expiryOf(userId)).toBe(before);
  });

  it("hands the client a longer cookie after the API has checked the session", async () => {
    const { cookie, userId } = await signedIn();
    await age(userId, 2);

    await lookup(new Headers({ cookie }));
    const res = await getSessionRoute(cookie);

    expect(sessionCookie(res)).toContain(`Max-Age=${WEEK_SECONDS}`);
    expect(await expiryOf(userId)).toBeGreaterThan(Date.now() + 6.9 * DAY);
  });

  it("keeps a session going past 7 days from sign-in with regular use", async () => {
    const { cookie, userId } = await signedIn();

    // Six days of use, then the refreshed cookie carries it past the first week
    await age(userId, 6);
    await getSessionRoute(cookie);
    await age(userId, 6);

    const found = await lookup(new Headers({ cookie }));
    expect(found?.user.id).toBe(userId);
  });

  it("sends no new cookie to a session under a day old", async () => {
    const { cookie } = await signedIn();

    expect(sessionCookie(await getSessionRoute(cookie))).toBeUndefined();
  });

  it("ends a session that went unused for 7 days", async () => {
    const { cookie, userId } = await signedIn();
    await age(userId, 7.01);

    expect(await lookup(new Headers({ cookie }))).toBeNull();
  });
});
