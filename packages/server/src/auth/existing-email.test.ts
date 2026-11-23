import { randomUUID } from "node:crypto";
import { eq, ilike, inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { accounts, rateLimits, users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { NOTICE_PREFIX } from "./account-limits.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";

type SignUpBody = { user: { email: string } };

describe.skipIf(!url)("signing up with an email that has an account", () => {
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
    // Several sign-ups in a row would trip it, and the limiter has its own tests
    rateLimit: false,
  });

  const signUp = (email: string, name: string, password: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ name, email, password }),
      }),
    );

  const signIn = (email: string, password: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ email, password }),
      }),
    );

  const linkIn = (mail: Mail | undefined, path: string) => {
    const link = mail?.text.match(new RegExp(`https://\\S+/${path}\\S+`))?.[0];
    if (!link) throw new Error(`No ${path} link in the email`);
    return link;
  };

  const newEmail = () => `existing-${randomUUID()}@meritory.test`;

  // Matches every casing, so a second row in any case would show up
  const accountsFor = (email: string) =>
    db
      .select({ name: users.name, password: accounts.password })
      .from(users)
      .innerJoin(accounts, eq(accounts.userId, users.id))
      .where(ilike(users.email, email));

  const mailTo = (email: string) => sent.filter((mail) => mail.to === email);

  const confirm = (email: string) =>
    db.update(users).set({ emailVerified: true }).where(eq(users.email, email));

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "existing-%@meritory.test"));
    await db.delete(verifications).where(
      inArray(
        verifications.identifier,
        mine.map(({ id }) => `email-link:${id}`),
      ),
    );
    await db.delete(verifications).where(
      inArray(
        verifications.value,
        mine.map(({ id }) => id),
      ),
    );
    await db.delete(rateLimits).where(
      inArray(
        rateLimits.key,
        mine.map(({ id }) => `${NOTICE_PREFIX}existing-account|${id}`),
      ),
    );
    await db.delete(users).where(like(users.email, "existing-%@meritory.test"));
    await database.close();
  });

  it("keeps the first account and tells its owner", async () => {
    const email = newEmail();
    const first = await signUp(
      email,
      "Owner",
      "violet harbor tractor sandwich",
    );
    expect(first.status).toBe(200);
    await confirm(email);
    const [before] = await accountsFor(email);

    const second = await signUp(email, "Someone", "maple glacier pencil drum");
    expect(second.status).toBe(200);

    const after = await accountsFor(email);
    expect(after).toHaveLength(1);
    expect(after[0]).toEqual(before);
    await expect
      .poll(() => mailTo(email).map((mail) => mail.subject))
      .toContain("Someone tried to sign up with your email");
  });

  it("tells the owner once a minute, and answers the same each time", async () => {
    const email = newEmail();
    await signUp(email, "Owner", "violet harbor tractor sandwich");
    await confirm(email);
    const notices = () =>
      mailTo(email).filter(
        (mail) => mail.subject === "Someone tried to sign up with your email",
      );

    const first = await signUp(email, "Someone", "maple glacier pencil drum");
    await expect.poll(() => notices().length).toBe(1);
    const again = await signUp(email, "Someone", "maple glacier pencil drum");
    expect(again.status).toBe(first.status);
    const shape = async (res: Response) =>
      Object.keys((await res.json()) as SignUpBody).sort();
    expect(await shape(again)).toEqual(await shape(first));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(notices()).toHaveLength(1);
  });

  it("answers the same way whether or not the email has an account", async () => {
    const email = newEmail();
    await signUp(email, "Owner", "violet harbor tractor sandwich");
    await confirm(email);

    const taken = await signUp(email, "Someone", "maple glacier pencil drum");
    const fresh = await signUp(
      newEmail(),
      "Someone",
      "maple glacier pencil drum",
    );

    expect(taken.status).toBe(fresh.status);
    const takenBody = (await taken.json()) as SignUpBody;
    const freshBody = (await fresh.json()) as SignUpBody;
    expect(Object.keys(takenBody).sort()).toEqual(
      Object.keys(freshBody).sort(),
    );
    expect(Object.keys(takenBody.user).sort()).toEqual(
      Object.keys(freshBody.user).sort(),
    );
    expect(takenBody.user.email).toBe(email);
  });

  it("treats a capitalized email as the same account", async () => {
    const email = newEmail();
    await signUp(email, "Owner", "violet harbor tractor sandwich");
    await confirm(email);

    const shouted = await signUp(
      email.toUpperCase(),
      "Someone",
      "maple glacier pencil drum",
    );
    expect(shouted.status).toBe(200);

    expect(await accountsFor(email)).toHaveLength(1);
    await expect
      .poll(() => mailTo(email).map((mail) => mail.subject))
      .toContain("Someone tried to sign up with your email");
  });

  it("asks an unconfirmed owner to choose the password instead", async () => {
    const email = newEmail();
    await signUp(email, "Owner", "violet harbor tractor sandwich");
    await expect.poll(() => mailTo(email).length).toBe(1);

    await signUp(email, "Someone", "maple glacier pencil drum");

    await expect.poll(() => mailTo(email).length).toBe(2);
    const finish = mailTo(email)[1];
    expect(finish?.subject).toBe("Finish signing up for Meritory");
    expect(finish?.text).toMatch(/reset-password/);
    expect(finish?.text).not.toMatch(/verify-email/);
    // Neither sign-up's password is kept until the inbox owner picks one
    expect(await accountsFor(email)).toHaveLength(0);
  });

  it("lets only the inbox owner sign in after someone signed up first", async () => {
    const email = newEmail();
    const first = "violet harbor tractor sandwich";
    const owner = "maple glacier pencil drum";
    const chosen = "copper lantern meadow violin";
    await signUp(email, "Someone", first);
    await expect.poll(() => mailTo(email).length).toBe(1);
    const verifyLink = linkIn(mailTo(email)[0], "verify-email");

    await signUp(email, "Owner", owner);
    await expect.poll(() => mailTo(email).length).toBe(2);
    const resetLink = linkIn(mailTo(email)[1], "reset-password");

    // The first link still confirms the email, but leaves no password to use
    const verified = await auth.handler(
      new Request(verifyLink, { redirect: "manual" }),
    );
    expect(verified.status).toBe(302);
    expect((await signIn(email, first)).status).toBe(401);
    expect((await signIn(email, owner)).status).toBe(401);

    const opened = await auth.handler(
      new Request(resetLink, { redirect: "manual" }),
    );
    const landing = new URL(opened.headers.get("location") ?? "", ORIGIN);
    // The page asks for a first password, not a new one
    expect(landing.pathname).toBe("/reset-password");
    expect(landing.searchParams.get("finish")).toBe("1");
    const token = landing.searchParams.get("token");
    const reset = await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ token, newPassword: chosen }),
      }),
    );
    expect(reset.status).toBe(200);

    expect((await signIn(email, first)).status).toBe(401);
    expect((await signIn(email, chosen)).status).toBe(200);
    // A first password isn't a change, so no changed email goes out
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mailTo(email).map((mail) => mail.subject)).not.toContain(
      "Your Meritory password was changed",
    );
  });

  it("finishes the sign-up when the owner resends the confirm link", async () => {
    const email = newEmail();
    const first = "violet harbor tractor sandwich";
    await signUp(email, "Someone", first);
    await signUp(email, "Owner", "maple glacier pencil drum");
    await expect.poll(() => mailTo(email).length).toBe(2);

    await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/send-verification-email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ email }),
      }),
    );
    await expect.poll(() => mailTo(email).length).toBe(3);
    await auth.handler(
      new Request(linkIn(mailTo(email)[2], "verify-email"), {
        redirect: "manual",
      }),
    );

    expect((await signIn(email, first)).status).toBe(401);
  });

  it("makes one account when two sign-ups arrive at once", async () => {
    const email = newEmail();
    await Promise.all([
      signUp(email, "One", "violet harbor tractor sandwich"),
      signUp(email, "Two", "maple glacier pencil drum"),
    ]);

    expect(await accountsFor(email)).toHaveLength(1);
  });
});
