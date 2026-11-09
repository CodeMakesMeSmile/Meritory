import { randomUUID } from "node:crypto";
import { and, eq, inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { sessions, users, verifications } from "../db/schema.ts";
import type { Mail, MailTag } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const NEW_PASSWORD = "copper lantern meadow quartz";

describe.skipIf(!url)("password reset against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: Mail[] = [];
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer: { send: async (mail) => void sent.push(mail) },
    log: { error: () => {} },
    // Many requests in a row would trip it, and the limiter has its own tests
    rateLimit: false,
  });

  const post = (path: string, body: object, cookie?: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );

  const mailTo = (email: string, subject: string) =>
    sent.filter((mail) => mail.to === email && mail.subject === subject);

  const resetMails = (email: string) =>
    mailTo(email, "Reset your Meritory password");

  const tokenIn = (mail: Mail | undefined) =>
    mail?.text.match(/\/reset-password\/([^?\s]+)/)?.[1] ?? "";

  const newAccount = async (verified = true) => {
    const email = `reset-${randomUUID()}@meritory.test`;
    await post("/sign-up/email", { name: "Rowan", email, password: PASSWORD });
    if (verified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.email, email));
    }
    return email;
  };

  // Requests a link and waits for its email
  const requestLink = async (email: string, count = 1) => {
    await post("/request-password-reset", { email });
    await expect.poll(() => resetMails(email).length).toBe(count);
    return tokenIn(resetMails(email).at(-1));
  };

  const resetLinkRows = async (email: string) => {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    return db
      .select()
      .from(verifications)
      .where(
        and(
          like(verifications.identifier, "reset-password:%"),
          eq(verifications.value, user?.id ?? ""),
        ),
      );
  };

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "reset-%@meritory.test"));
    const ids = mine.map(({ id }) => id);
    if (ids.length > 0) {
      await db.delete(verifications).where(inArray(verifications.value, ids));
      await db.delete(verifications).where(
        inArray(
          verifications.identifier,
          ids.map((id) => `email-link:${id}`),
        ),
      );
    }
    await db.delete(users).where(like(users.email, "reset-%@meritory.test"));
    await database.close();
  });

  it("answers the same for an unknown email", async () => {
    const known = await post("/request-password-reset", {
      email: await newAccount(),
    });
    const unknown = await post("/request-password-reset", {
      email: `reset-${randomUUID()}@meritory.test`,
    });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(known.status);
    expect(await unknown.json()).toEqual(await known.json());
  });

  it("answers before the email is queued", async () => {
    const email = await newAccount();
    const tags: MailTag[] = [];
    let release = () => {};
    const queueing = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow = createAuth({
      db,
      secret: "x".repeat(32),
      baseUrl: `${ORIGIN}/api/v1/auth`,
      webOrigin: ORIGIN,
      appScheme: "app.meritory.mobile://",
      mailer: {
        send: (_, tag) => {
          tags.push(tag);
          return queueing;
        },
      },
      log: { error: () => {} },
      rateLimit: false,
    });
    const res = await slow.handler(
      new Request(`${ORIGIN}/api/v1/auth/request-password-reset`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ email }),
      }),
    );
    expect(res.status).toBe(200);
    await expect
      .poll(() => tags)
      .toEqual([{ kind: "reset-password", userId: expect.any(String) }]);
    release();
  });

  it("stores only a hash of the token", async () => {
    const email = await newAccount();
    const token = await requestLink(email);

    const rows = await resetLinkRows(email);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.identifier).toMatch(/^reset-password:[0-9a-f]{64}$/);
    expect(rows[0]?.identifier).not.toContain(token);
  });

  it("lands on our reset page whatever the client asks for", async () => {
    const email = await newAccount();
    await post("/request-password-reset", {
      email,
      redirectTo: "/somewhere-else",
    });
    await expect.poll(() => resetMails(email).length).toBe(1);
    expect(resetMails(email)[0]?.text).toContain(
      "callbackURL=%2Freset-password",
    );

    const token = tokenIn(resetMails(email)[0]);
    const open = await auth.handler(
      new Request(
        `${ORIGIN}/api/v1/auth/reset-password/${token}?callbackURL=%2Freset-password`,
      ),
    );
    expect(open.headers.get("location")).toBe(
      `${ORIGIN}/reset-password?token=${token}`,
    );
  });

  it("sends one email a minute per account, whatever the IP", async () => {
    const email = await newAccount();
    const first = await requestLink(email);

    await post("/request-password-reset", { email });
    await post("/request-password-reset", { email });

    // Give the dropped requests time to send, if they were going to
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(resetMails(email)).toHaveLength(1);
    expect(await resetLinkRows(email)).toHaveLength(1);
    const res = await post("/reset-password", {
      token: first,
      newPassword: NEW_PASSWORD,
    });
    expect(res.status).toBe(200);
  });

  it("cancels the older link when a new one is sent", async () => {
    const email = await newAccount();
    const old = await requestLink(email);
    // As if the first email went out over a minute ago
    const rows = await resetLinkRows(email);
    await db
      .update(verifications)
      .set({ createdAt: new Date(Date.now() - 2 * 60 * 1000) })
      .where(
        inArray(
          verifications.id,
          rows.map(({ id }) => id),
        ),
      );

    const fresh = await requestLink(email, 2);
    expect(fresh).not.toBe(old);

    const stale = await post("/reset-password", {
      token: old,
      newPassword: NEW_PASSWORD,
    });
    expect(await stale.json()).toMatchObject({ code: "INVALID_TOKEN" });
    expect(
      (
        await post("/reset-password", {
          token: fresh,
          newPassword: NEW_PASSWORD,
        })
      ).status,
    ).toBe(200);
  });

  it.each([
    ["weak", "aaaaaaaaaaaaaaaa", "PASSWORD_TOO_WEAK"],
    ["short", "too short", "PASSWORD_TOO_SHORT"],
    ["personal", "rowan rowan rowan rowan", "PASSWORD_PERSONAL"],
    ["about the product", "meritory meritory meritory", "PASSWORD_PERSONAL"],
  ])(
    "refuses a %s password and keeps the link",
    async (_kind, password, code) => {
      const email = await newAccount();
      const token = await requestLink(email);

      const refused = await post("/reset-password", {
        token,
        newPassword: password,
      });
      expect(refused.status).toBe(400);
      expect(await refused.json()).toMatchObject({ code });

      const ok = await post("/reset-password", {
        token,
        newPassword: NEW_PASSWORD,
      });
      expect(ok.status).toBe(200);
    },
  );

  it("refuses a password that contains the email", async () => {
    const email = await newAccount();
    const token = await requestLink(email);
    const refused = await post("/reset-password", {
      token,
      newPassword: `${email} and more words`,
    });
    expect(await refused.json()).toMatchObject({ code: "PASSWORD_PERSONAL" });
  });

  it("saves the password, signs out everywhere, and tells the owner", async () => {
    const email = await newAccount();
    const signIn = await post("/sign-in/email", { email, password: PASSWORD });
    expect(signIn.status).toBe(200);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    const userId = user?.id ?? "";
    expect(
      await db.select().from(sessions).where(eq(sessions.userId, userId)),
    ).toHaveLength(1);

    const token = await requestLink(email);
    const res = await post("/reset-password", {
      token,
      newPassword: NEW_PASSWORD,
    });
    expect(res.status).toBe(200);
    // Not signed in by the reset
    expect(res.headers.getSetCookie()).toHaveLength(0);

    expect(
      await db.select().from(sessions).where(eq(sessions.userId, userId)),
    ).toHaveLength(0);
    expect(await resetLinkRows(email)).toHaveLength(0);
    await expect
      .poll(() => mailTo(email, "Your Meritory password was changed").length)
      .toBe(1);

    expect(
      (await post("/sign-in/email", { email, password: PASSWORD })).status,
    ).toBe(401);
    expect(
      (await post("/sign-in/email", { email, password: NEW_PASSWORD })).status,
    ).toBe(200);
  });

  it("works once", async () => {
    const email = await newAccount();
    const token = await requestLink(email);
    await post("/reset-password", { token, newPassword: NEW_PASSWORD });

    const again = await post("/reset-password", {
      token,
      newPassword: "another quite long passphrase here",
    });
    expect(await again.json()).toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("confirms an unconfirmed email", async () => {
    const email = await newAccount(false);
    const token = await requestLink(email);
    await post("/reset-password", { token, newPassword: NEW_PASSWORD });

    const [user] = await db
      .select({ verified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email));
    expect(user?.verified).toBe(true);
    expect(
      (await post("/sign-in/email", { email, password: NEW_PASSWORD })).status,
    ).toBe(200);
  });

  it("refuses a made-up token", async () => {
    const res = await post("/reset-password", {
      token: "not-a-real-token",
      newPassword: NEW_PASSWORD,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "INVALID_TOKEN" });
  });
});
