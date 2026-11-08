import { randomUUID } from "node:crypto";
import { eq, inArray, like, or } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { rateLimits, sessions, users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { CONFIRM_LIMIT, createAccountSessions } from "./account-sessions.ts";
import { CHANGE_PASSWORD_LIMIT, createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const NEW_PASSWORD = "copper lantern meadow quartz";
const CHANGED = "Your Meritory password was changed";
const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
const FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0";

describe.skipIf(!url)("account security against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: Mail[] = [];
  const config = {
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "meritory://",
    mailer: { send: async (mail: Mail) => void sent.push(mail) },
    log: { error: () => {} },
  };
  // Many requests in a row would trip it, so only the limit tests turn it on
  const auth = createAuth({ ...config, rateLimit: false });
  const limited = createAuth({
    ...config,
    ipAddressHeaders: ["x-forwarded-for"],
  });
  const accountSessions = createAccountSessions(db, auth);
  const ips: string[] = [];

  const post = (
    path: string,
    body: object,
    headers: Record<string, string> = {},
    via = auth,
  ) =>
    via.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );

  const cookieFrom = (res: Response) =>
    res.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0] ?? "")
      .find((pair) => pair.includes("better-auth.session_token="));

  const newAccount = async () => {
    const email = `account-${randomUUID()}@meritory.test`;
    await post("/sign-up/email", { name: "Rowan", email, password: PASSWORD });
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));
    return email;
  };

  const signIn = async (
    email: string,
    userAgent = CHROME,
    password = PASSWORD,
  ) => {
    const res = await post(
      "/sign-in/email",
      { email, password },
      { "user-agent": userAgent },
    );
    expect(res.status).toBe(200);
    const cookie = cookieFrom(res);
    if (!cookie) throw new Error("no session cookie");
    return cookie;
  };

  const sessionOf = (cookie: string) =>
    auth.api.getSession({ headers: new Headers({ cookie }) });

  const changePassword = (
    cookie: string,
    body: object,
    headers: Record<string, string> = {},
    via = auth,
  ) => post("/change-password", body, { cookie, ...headers }, via);

  const changedMails = (email: string) =>
    sent.filter((mail) => mail.to === email && mail.subject === CHANGED);

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "account-%@meritory.test"));
    const ids = mine.map(({ id }) => id);
    if (ids.length > 0) {
      await db.delete(verifications).where(
        inArray(
          verifications.identifier,
          ids.map((id) => `email-link:${id}`),
        ),
      );
      await db.delete(rateLimits).where(
        inArray(
          rateLimits.key,
          ids.map((id) => `confirm-password|${id}`),
        ),
      );
    }
    if (ips.length > 0) {
      await db
        .delete(rateLimits)
        .where(or(...ips.map((ip) => like(rateLimits.key, `${ip}|%`))));
    }
    await db.delete(users).where(like(users.email, "account-%@meritory.test"));
    await database.close();
  });

  describe("change password", () => {
    it("ends every other session and keeps this one, even when not asked", async () => {
      const email = await newAccount();
      const here = await signIn(email);
      const elsewhere = await signIn(email, FIREFOX);

      const res = await changePassword(here, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
        revokeOtherSessions: false,
      });
      expect(res.status).toBe(200);

      expect(await sessionOf(elsewhere)).toBeNull();
      const renewed = cookieFrom(res);
      expect(renewed).toBeDefined();
      expect((await sessionOf(renewed ?? ""))?.user.email).toBe(email);
      await signIn(email, CHROME, NEW_PASSWORD);
    });

    it("runs the sign-up rules on the new password", async () => {
      const email = await newAccount();
      const here = await signIn(email);

      const res = await changePassword(here, {
        currentPassword: PASSWORD,
        newPassword: "rowan likes long walks outside",
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ code: "PASSWORD_PERSONAL" });
      await signIn(email);
    });

    it("changes nothing when the current password is wrong", async () => {
      const email = await newAccount();
      const here = await signIn(email);
      const elsewhere = await signIn(email, FIREFOX);

      const res = await changePassword(here, {
        currentPassword: "not the password at all, sorry",
        newPassword: NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ code: "INVALID_PASSWORD" });
      expect(await sessionOf(elsewhere)).not.toBeNull();
      await signIn(email);
      expect(changedMails(email)).toHaveLength(0);
    });

    it("emails the owner only after a change", async () => {
      const email = await newAccount();
      const here = await signIn(email);
      await changePassword(here, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });
      await expect.poll(() => changedMails(email).length).toBe(1);
      expect(changedMails(email)[0]?.text).toContain(
        `${ORIGIN}/forgot-password`,
      );
    });

    it("refuses a signed-out request", async () => {
      const res = await post("/change-password", {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });
      expect(res.status).toBe(401);
    });

    it(`allows ${CHANGE_PASSWORD_LIMIT.max} tries per IP in ${CHANGE_PASSWORD_LIMIT.window / 60} minutes`, async () => {
      const email = await newAccount();
      const ip = `10.${[1, 2, 3].map(() => Math.floor(Math.random() * 250)).join(".")}`;
      ips.push(ip);
      const here = await signIn(email);
      const attempt = () =>
        changePassword(
          here,
          {
            currentPassword: "wrong wrong wrong wrong",
            newPassword: NEW_PASSWORD,
          },
          { "x-forwarded-for": ip },
          limited,
        );
      for (let i = 0; i < CHANGE_PASSWORD_LIMIT.max; i++) {
        expect((await attempt()).status).toBe(400);
      }
      const blocked = await attempt();
      expect(blocked.status).toBe(429);
      expect(Number(blocked.headers.get("x-retry-after"))).toBeGreaterThan(60);
    });
  });

  describe("sessions", () => {
    it("lists this account's sessions by device, without tokens", async () => {
      const email = await newAccount();
      await signIn(email);
      await signIn(email, FIREFOX);
      await signIn(await newAccount());
      const user = (await sessionOf(await signIn(email)))?.user;

      const list = await accountSessions.list(user?.id ?? "");
      expect(list).toHaveLength(3);
      expect(list.map((s) => s.device).sort()).toEqual([
        "Chrome on Windows",
        "Chrome on Windows",
        "Firefox on macOS",
      ]);
      expect(Object.keys(list[0] ?? {}).sort()).toEqual([
        "device",
        "id",
        "lastActiveAt",
        "signedInAt",
      ]);
    });

    it("leaves out expired sessions", async () => {
      const email = await newAccount();
      const old = (await sessionOf(await signIn(email)))?.session;
      await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(sessions.id, old?.id ?? ""));
      const list = await accountSessions.list(old?.userId ?? "");
      expect(list).toHaveLength(0);
    });

    it("ends one session, and that device is signed out at once", async () => {
      const email = await newAccount();
      const here = await sessionOf(await signIn(email));
      const elsewhereCookie = await signIn(email, FIREFOX);
      const elsewhere = await sessionOf(elsewhereCookie);

      expect(
        await accountSessions.end(
          here?.user.id ?? "",
          elsewhere?.session.id ?? "",
        ),
      ).toBe(true);
      expect(await sessionOf(elsewhereCookie)).toBeNull();
    });

    it("won't end someone else's session", async () => {
      const mine = await sessionOf(await signIn(await newAccount()));
      const theirCookie = await signIn(await newAccount());
      const theirs = await sessionOf(theirCookie);

      expect(
        await accountSessions.end(
          mine?.user.id ?? "",
          theirs?.session.id ?? "",
        ),
      ).toBe(false);
      expect(await sessionOf(theirCookie)).not.toBeNull();
    });

    it("ends every other session and keeps this one", async () => {
      const email = await newAccount();
      const hereCookie = await signIn(email);
      const here = await sessionOf(hereCookie);
      const others = [await signIn(email, FIREFOX), await signIn(email)];
      const strangerCookie = await signIn(await newAccount());

      expect(
        await accountSessions.endOthers(
          here?.user.id ?? "",
          here?.session.id ?? "",
        ),
      ).toBe(2);
      for (const cookie of others) expect(await sessionOf(cookie)).toBeNull();
      expect(await sessionOf(hereCookie)).not.toBeNull();
      expect(await sessionOf(strangerCookie)).not.toBeNull();
    });
  });

  describe("confirm password", () => {
    const confirm = async (cookie: string, password: string) => {
      const session = await sessionOf(cookie);
      return accountSessions.confirmPassword({
        userId: session?.user.id ?? "",
        sessionId: session?.session.id ?? "",
        password,
        headers: new Headers({ cookie }),
      });
    };

    it("marks the session confirmed for the right password", async () => {
      const cookie = await signIn(await newAccount());
      expect(await confirm(cookie, PASSWORD)).toEqual({ ok: true });
      const session = (await sessionOf(cookie))?.session as
        | { confirmedAt?: Date | null }
        | undefined;
      expect(session?.confirmedAt).toBeInstanceOf(Date);
    });

    it("refuses a wrong password and changes nothing", async () => {
      const cookie = await signIn(await newAccount());
      expect(await confirm(cookie, "not my password, not at all")).toEqual({
        ok: false,
        reason: "wrong_password",
      });
      const session = (await sessionOf(cookie))?.session as
        | { confirmedAt?: Date | null }
        | undefined;
      expect(session?.confirmedAt ?? null).toBeNull();
    });

    it(`allows ${CONFIRM_LIMIT.max} tries per account, then waits even for the right password`, async () => {
      const email = await newAccount();
      const cookie = await signIn(email);
      for (let i = 0; i < CONFIRM_LIMIT.max; i++) {
        expect((await confirm(cookie, "wrong wrong wrong wrong")).ok).toBe(
          false,
        );
      }
      const blocked = await confirm(cookie, PASSWORD);
      expect(blocked).toMatchObject({ ok: false, reason: "rate_limited" });
      if (!blocked.ok && blocked.reason === "rate_limited") {
        expect(blocked.retryAfter).toBeGreaterThan(60);
        expect(blocked.retryAfter).toBeLessThanOrEqual(
          CONFIRM_LIMIT.windowSeconds,
        );
      }

      // Another device on the same account shares the count
      const other = await signIn(email, FIREFOX);
      expect(await confirm(other, PASSWORD)).toMatchObject({
        reason: "rate_limited",
      });
    });
  });
});
