import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const NEW_PASSWORD = "copper lantern meadow quartz";
// Passes the local rules, and the fake check below treats it as breached
const BREACHED = "amber falcon window pebble";
const COMPROMISED = {
  code: "PASSWORD_COMPROMISED",
  message:
    "This password has shown up in a data breach, so it's easy to guess. Choose a different one, like a few unrelated words.",
};

function setup(db: ReturnType<typeof createDatabase>["db"]) {
  const checked: string[] = [];
  const sent: Mail[] = [];
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer: { send: async (mail) => void sent.push(mail) },
    log: { error: () => {} },
    rateLimit: false,
    breachCheck: async (password) => {
      checked.push(password);
      return password === BREACHED;
    },
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
  return { auth, post, checked, sent };
}

describe("the breached password check on sign-up", () => {
  // The client connects lazily, and a refused sign-up never queries
  const database = createDatabase("postgres://meritory@127.0.0.1:1/meritory");
  const { post, checked } = setup(database.db);

  beforeEach(() => void checked.splice(0));
  afterAll(() => database.close());

  const signUp = (password: string) =>
    post("/sign-up/email", {
      name: "Rowan",
      email: "rowan@example.com",
      password,
    });

  it("refuses a breached password before touching the database", async () => {
    const res = await signUp(BREACHED);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject(COMPROMISED);
    expect(checked).toEqual([BREACHED]);
  });

  it("never sends a password the local rules refuse", async () => {
    const res = await signUp("too short");
    expect(await res.json()).toMatchObject({ code: "PASSWORD_TOO_SHORT" });
    expect(checked).toEqual([]);
  });
});

describe.skipIf(!url)("the breached password check against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const { post, checked, sent } = setup(db);

  beforeEach(() => void checked.splice(0));

  const newAccount = async () => {
    const email = `breach-${randomUUID()}@meritory.test`;
    await post("/sign-up/email", { name: "Rowan", email, password: PASSWORD });
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));
    checked.splice(0);
    return email;
  };

  const signIn = async (email: string, password = PASSWORD) =>
    post("/sign-in/email", { email, password });

  const cookieFrom = (res: Response) =>
    res.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0] ?? "")
      .find((pair) => pair.includes("better-auth.session_token="));

  const resetMails = (email: string) =>
    sent.filter(
      (mail) =>
        mail.to === email && mail.subject === "Reset your Meritory password",
    );

  const resetToken = async (email: string) => {
    await post("/request-password-reset", { email });
    await expect.poll(() => resetMails(email).length).toBe(1);
    const mail = resetMails(email)[0];
    return mail?.text.match(/\/reset-password\/([^?\s]+)/)?.[1] ?? "";
  };

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "breach-%@meritory.test"));
    const ids = mine.map(({ id }) => id);
    if (ids.length > 0) {
      await db.delete(verifications).where(inArray(verifications.value, ids));
      await db.delete(verifications).where(
        inArray(
          verifications.identifier,
          ids.map((id) => `email-link:${id}`),
        ),
      );
      await db.delete(users).where(inArray(users.id, ids));
    }
    await database.close();
  });

  it("gives the same answer when the email already has an account", async () => {
    const email = await newAccount();
    const res = await post("/sign-up/email", {
      name: "Someone",
      email,
      password: BREACHED,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject(COMPROMISED);
  });

  it("refuses a breached new password and keeps the old one", async () => {
    const email = await newAccount();
    const cookie = cookieFrom(await signIn(email));
    if (!cookie) throw new Error("no session cookie");

    const res = await post(
      "/change-password",
      { currentPassword: PASSWORD, newPassword: BREACHED },
      cookie,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject(COMPROMISED);
    expect((await signIn(email)).status).toBe(200);
  });

  it("doesn't check a password change without a session", async () => {
    const res = await post("/change-password", {
      currentPassword: PASSWORD,
      newPassword: BREACHED,
    });
    expect(res.status).toBe(401);
    expect(checked).toEqual([]);
  });

  it("refuses a breached password on reset and keeps the link", async () => {
    const email = await newAccount();
    const token = await resetToken(email);

    const refused = await post("/reset-password", {
      token,
      newPassword: BREACHED,
    });
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject(COMPROMISED);

    const ok = await post("/reset-password", {
      token,
      newPassword: NEW_PASSWORD,
    });
    expect(ok.status).toBe(200);
  });

  it("doesn't check a reset with an unknown link", async () => {
    const res = await post("/reset-password", {
      token: "unknown",
      newPassword: BREACHED,
    });
    expect(await res.json()).toMatchObject({ code: "INVALID_TOKEN" });
    expect(checked).toEqual([]);
  });
});
