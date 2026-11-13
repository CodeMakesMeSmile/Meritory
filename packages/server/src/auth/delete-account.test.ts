import { randomUUID } from "node:crypto";
import { eq, like, or } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import {
  accounts,
  rateLimits,
  sessions,
  users,
  verifications,
} from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { CONFIRM_KEY_PREFIX } from "./account-sessions.ts";
import { createAuth } from "./auth.ts";
import { clearCookie, createAccountDeletion } from "./delete-account.ts";
import { RESET_PREFIX } from "./reset-links.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const DELETED = "Your Meritory account was deleted";
const HOUR = 60 * 60 * 1000;

// The goodbye email goes out after the answer, so tests wait for it
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

describe("clearCookie", () => {
  it("expires the cookie with the same scope it was set with", () => {
    expect(
      clearCookie("__Secure-better-auth.session_token", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    ).toBe(
      "__Secure-better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=lax",
    );
    expect(clearCookie("plain", {})).toBe("plain=; Path=/; Max-Age=0");
  });
});

describe.skipIf(!url)("deleting an account against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: Mail[] = [];
  const forgotten: string[] = [];
  const mailer = {
    send: async (mail: Mail) => void sent.push(mail),
    forget: async (userId: string) => void forgotten.push(userId),
  };
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer,
    log: { error: () => {} },
    rateLimit: false,
  });
  const deletion = createAccountDeletion({
    db,
    auth,
    mailer,
    webOrigin: ORIGIN,
    log: { error: () => {} },
  });

  const post = (path: string, body: object) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify(body),
      }),
    );

  const signIn = async (email: string) => {
    const res = await post("/sign-in/email", { email, password: PASSWORD });
    return res.headers
      .getSetCookie()
      .map((value) => value.split(";")[0] ?? "")
      .find((pair) => pair.includes("better-auth.session_token="));
  };

  const newAccount = async (email = `delete-${randomUUID()}@meritory.test`) => {
    await post("/sign-up/email", { name: "Rowan", email, password: PASSWORD });
    const [row] = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email))
      .returning({ id: users.id });
    if (!row) throw new Error("no account");
    return { email, id: row.id };
  };

  // Leftovers a deleted account could otherwise still be reached through
  const leaveTraces = async (id: string) => {
    const expiresAt = new Date(Date.now() + HOUR);
    await db.insert(verifications).values([
      { identifier: `email-link:${id}`, value: randomUUID(), expiresAt },
      {
        identifier: `${RESET_PREFIX}${randomUUID()}`,
        value: id,
        expiresAt,
      },
    ]);
    await db.insert(rateLimits).values({
      key: `${CONFIRM_KEY_PREFIX}${id}`,
      count: 1,
      lastRequest: Date.now(),
    });
  };

  const tracesOf = async (id: string) => ({
    users: await db.select().from(users).where(eq(users.id, id)),
    sessions: await db.select().from(sessions).where(eq(sessions.userId, id)),
    accounts: await db.select().from(accounts).where(eq(accounts.userId, id)),
    links: await db
      .select()
      .from(verifications)
      .where(
        or(
          eq(verifications.identifier, `email-link:${id}`),
          eq(verifications.value, id),
        ),
      ),
    limits: await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, `${CONFIRM_KEY_PREFIX}${id}`)),
  });

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "delete-%@meritory.test"));
    for (const { id } of mine) {
      await deletion.delete(id);
    }
    await settle();
    await database.close();
  });

  it("removes the account and every trace of it, and only it", async () => {
    const rowan = await newAccount();
    const other = await newAccount();
    const here = await signIn(rowan.email);
    await signIn(rowan.email);
    await leaveTraces(rowan.id);
    await leaveTraces(other.id);
    if (!here) throw new Error("no session cookie");
    const before = await tracesOf(other.id);

    const { cookies } = await deletion.delete(rowan.id);

    expect(await tracesOf(rowan.id)).toEqual({
      users: [],
      sessions: [],
      accounts: [],
      links: [],
      limits: [],
    });
    expect(before.links.length).toBeGreaterThanOrEqual(2);
    expect(before.limits).toHaveLength(1);
    expect(await tracesOf(other.id)).toEqual(before);
    expect(forgotten).toContain(rowan.id);
    expect(forgotten).not.toContain(other.id);

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: here }),
      query: { disableCookieCache: true },
    });
    expect(session).toBeNull();
    expect(cookies).toHaveLength(3);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/^[^=]+=; Path=\/; Max-Age=0; HttpOnly/);
    }
    expect(cookies.join("\n")).toContain("better-auth.session_token=;");
  });

  it("emails a confirmation that names no way back in", async () => {
    const rowan = await newAccount();
    await deletion.delete(rowan.id);
    await settle();
    const mails = sent.filter(
      (mail) => mail.to === rowan.email && mail.subject === DELETED,
    );
    expect(mails).toHaveLength(1);
    expect(mails[0]?.text).toContain(`${ORIGIN}/sign-up`);
    expect(mails[0]?.text).not.toMatch(/reset-password|verify-email|token=/);
  });

  it("lets the same email sign up again as a new account", async () => {
    const rowan = await newAccount();
    await deletion.delete(rowan.id);
    const again = await newAccount(rowan.email);
    expect(again.id).not.toBe(rowan.id);
    expect(await signIn(rowan.email)).toBeDefined();
  });

  it("does nothing for an account that's already gone", async () => {
    const before = sent.length;
    const id = randomUUID();
    expect(await deletion.delete(id)).toEqual({ cookies: [] });
    await settle();
    expect(sent.length).toBe(before);
    expect(forgotten).not.toContain(id);
  });
});
