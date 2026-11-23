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
    appScheme: "app.meritory.mobile://",
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

  it("leaves the session token out of get-session, refreshed or not", async () => {
    const { cookie, userId } = await signedIn();
    const plain = await getSessionRoute(cookie);
    const body = (await plain.json()) as { session: Record<string, unknown> };
    expect(body.session.userId).toBe(userId);
    expect(body.session).not.toHaveProperty("token");
    // The signed cookie is the token, a dot, and its signature
    const token =
      decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0] ?? "";
    expect(token).not.toBe("");
    expect(JSON.stringify(body)).not.toContain(token);

    await age(userId, 2);
    const refreshed = await getSessionRoute(cookie);
    expect(sessionCookie(refreshed)).toContain(`Max-Age=${WEEK_SECONDS}`);
    const after = (await refreshed.json()) as {
      session: Record<string, unknown>;
    };
    expect(after.session.userId).toBe(userId);
    expect(after.session).not.toHaveProperty("token");

    // The API's own lookup still finds the session
    expect((await lookup(new Headers({ cookie })))?.user.id).toBe(userId);
  });

  it("keeps tokens out of sign-up, sign-in, and change password bodies", async () => {
    const email = `refresh-${randomUUID()}@meritory.test`;
    const signUp = await post("/sign-up/email", {
      name: "Rowan",
      email,
      password: PASSWORD,
    });
    expect(signUp.status).toBe(200);
    const signedUp = (await signUp.json()) as Record<string, unknown>;
    expect(signedUp).not.toHaveProperty("token");
    expect(signedUp.user).toMatchObject({ email });
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));

    const signIn = await post("/sign-in/email", { email, password: PASSWORD });
    expect(signIn.status).toBe(200);
    const signedIn = (await signIn.json()) as Record<string, unknown>;
    expect(signedIn).not.toHaveProperty("token");
    expect(signedIn).toMatchObject({ redirect: false, user: { email } });
    const cookie = sessionCookie(signIn)?.split(";")[0] ?? "";
    expect((await lookup(new Headers({ cookie })))?.user.email).toBe(email);

    const change = await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          cookie,
        },
        body: JSON.stringify({
          currentPassword: PASSWORD,
          newPassword: "copper lantern meadow violin",
        }),
      }),
    );
    expect(change.status).toBe(200);
    const changed = (await change.json()) as Record<string, unknown>;
    expect(changed).not.toHaveProperty("token");
    expect(changed.user).toMatchObject({ email });
    // Other sessions end, so the new cookie is the one that works
    const renewed = sessionCookie(change)?.split(";")[0] ?? "";
    expect(renewed).not.toBe("");
    expect((await lookup(new Headers({ cookie: renewed })))?.user.email).toBe(
      email,
    );
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
