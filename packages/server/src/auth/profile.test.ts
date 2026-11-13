import { randomUUID } from "node:crypto";
import { ATTACKS, CONTROL_ATTACKS } from "@meritory/security-testing";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { sessions, users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const APPROVE = "Approve your new email for Meritory";
const IN_USE = "Someone tried to use your email on Meritory";
const DAY = 24 * 60 * 60 * 1000;

// Emails go out after the response, so tests wait for them
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

describe.skipIf(!url)("profile changes against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: Mail[] = [];
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer: { send: async (mail: Mail) => void sent.push(mail) },
    log: { error: () => {} },
    rateLimit: false,
  });

  const post = (path: string, body: object, headers: Record<string, string>) =>
    auth.handler(
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

  const newAccount = async () => {
    const email = `profile-${randomUUID()}@meritory.test`;
    await post(
      "/sign-up/email",
      { name: "Rowan", email, password: PASSWORD },
      {},
    );
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));
    const res = await post("/sign-in/email", { email, password: PASSWORD }, {});
    const cookie = res.headers
      .getSetCookie()
      .map((value) => value.split(";")[0] ?? "")
      .find((pair) => pair.includes("better-auth.session_token="));
    if (!cookie) throw new Error("no session cookie");
    return { email, cookie };
  };

  const freshEmail = () => `profile-${randomUUID()}@meritory.test`;

  const mailsTo = (to: string, subject: string) =>
    sent.filter((mail) => mail.to === to && mail.subject === subject);

  const emailOf = async (email: string) => {
    const [row] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.email, email));
    return row?.email;
  };

  const idOf = async (email: string) => {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (!row) throw new Error("no such account");
    return row.id;
  };

  const makeStale = async (email: string) =>
    db
      .update(sessions)
      .set({ createdAt: new Date(Date.now() - 2 * DAY) })
      .where(eq(sessions.userId, await idOf(email)));

  const changeEmail = (cookie: string, newEmail: unknown) =>
    post("/change-email", { newEmail }, { cookie });

  const nameOf = async (email: string) => {
    const [row] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, email));
    return row?.name;
  };

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "profile-%@meritory.test"));
    if (mine.length > 0) {
      await db.delete(verifications).where(
        inArray(
          verifications.identifier,
          mine.map(({ id }) => `email-link:${id}`),
        ),
      );
    }
    await db.delete(users).where(like(users.email, "profile-%@meritory.test"));
    await database.close();
  });

  describe("change name", () => {
    it("saves the trimmed name and puts it in the session", async () => {
      const { email, cookie } = await newAccount();
      const res = await post("/update-user", { name: "  Annie  " }, { cookie });
      expect(res.status).toBe(200);
      expect(await nameOf(email)).toBe("Annie");
      const found = await auth.api.getSession({
        headers: new Headers({ cookie }),
        query: { disableCookieCache: true },
      });
      expect(found?.user.name).toBe("Annie");
    });

    it.each(["", "   ", ...CONTROL_ATTACKS])(
      "refuses the name %j and keeps the old one",
      async (name) => {
        const { email, cookie } = await newAccount();
        const res = await post("/update-user", { name }, { cookie });
        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ code: "NAME_INVALID" });
        expect(await nameOf(email)).toBe("Rowan");
      },
    );

    it("refuses anything besides the name", async () => {
      const { email, cookie } = await newAccount();
      for (const body of [
        { name: "Annie", image: "javascript:alert(1)" },
        { image: "https://evil.example/a.png" },
        { name: "Annie", email: "other@meritory.test" },
        { name: "Annie", emailVerified: false },
      ]) {
        const res = await post("/update-user", body, { cookie });
        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ code: "ONLY_NAME" });
      }
      expect(await nameOf(email)).toBe("Rowan");
    });

    it.each(ATTACKS)("stores the name %j exactly", async (name) => {
      const { email, cookie } = await newAccount();
      const res = await post("/update-user", { name }, { cookie });
      expect(res.status).toBe(200);
      expect(await nameOf(email)).toBe(name.trim());
    });

    it("needs a session and our own site", async () => {
      const { email, cookie } = await newAccount();
      const signedOut = await post("/update-user", { name: "Annie" }, {});
      expect(signedOut.status).toBe(401);
      for (const origin of ["https://evil.example", "null"]) {
        const res = await post(
          "/update-user",
          { name: "Annie" },
          { cookie, origin },
        );
        expect(res.status).toBe(403);
      }
      expect(await nameOf(email)).toBe("Rowan");
    });
  });

  describe("start an email change", () => {
    it("asks the current address to approve, and changes nothing yet", async () => {
      const { email, cookie } = await newAccount();
      const next = freshEmail();
      const res = await changeEmail(cookie, next);
      expect(res.status).toBe(200);
      await settle();
      const [approval] = mailsTo(email, APPROVE);
      expect(approval?.text).toContain(next);
      expect(approval?.text).toContain(
        `${ORIGIN}/api/v1/auth/verify-email?token=`,
      );
      expect(sent.filter((mail) => mail.to === next)).toEqual([]);
      expect(await emailOf(email)).toBe(email);
    });

    it("asks to confirm it's you when the sign-in is over a day old", async () => {
      const { email, cookie } = await newAccount();
      await makeStale(email);
      const res = await changeEmail(cookie, freshEmail());
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: "confirm_password" });
      await settle();
      expect(mailsTo(email, APPROVE)).toEqual([]);
    });

    it("answers the same for a taken address, and tells its owner instead", async () => {
      const asker = await newAccount();
      const owner = await newAccount();
      const free = await changeEmail(asker.cookie, freshEmail());
      const taken = await changeEmail(asker.cookie, owner.email.toUpperCase());
      expect(taken.status).toBe(free.status);
      expect(await taken.json()).toEqual(await free.json());
      await settle();
      // Only the free address got an approval link
      expect(mailsTo(asker.email, APPROVE)).toHaveLength(1);
      const [notice] = mailsTo(owner.email, IN_USE);
      expect(notice?.text).toContain(`${ORIGIN}/sign-in`);
      expect(await emailOf(owner.email)).toBe(owner.email);
    });

    it("says when it's already the account's email", async () => {
      const { email, cookie } = await newAccount();
      for (const same of [email, email.toUpperCase()]) {
        const res = await changeEmail(cookie, same);
        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ code: "SAME_EMAIL" });
      }
      await settle();
      expect(mailsTo(email, APPROVE)).toEqual([]);
      expect(mailsTo(email, IN_USE)).toEqual([]);
    });

    it.each([
      "",
      "not-an-email",
      "rowan@meritory.test\r\nBcc: someone@evil.example",
      42,
    ])("refuses %j and sends nothing", async (newEmail) => {
      const { email, cookie } = await newAccount();
      const res = await changeEmail(cookie, newEmail);
      expect(res.status).toBe(400);
      await settle();
      expect(mailsTo(email, APPROVE)).toEqual([]);
    });

    it("needs a session and our own site", async () => {
      const { email, cookie } = await newAccount();
      const signedOut = await post(
        "/change-email",
        { newEmail: freshEmail() },
        {},
      );
      expect(signedOut.status).toBe(401);
      for (const origin of ["https://evil.example", "null"]) {
        const res = await post(
          "/change-email",
          { newEmail: freshEmail() },
          { cookie, origin },
        );
        expect(res.status).toBe(403);
      }
      await settle();
      expect(mailsTo(email, APPROVE)).toEqual([]);
    });
  });
});
