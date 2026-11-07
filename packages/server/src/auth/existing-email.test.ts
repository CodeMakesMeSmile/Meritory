import { randomUUID } from "node:crypto";
import { eq, ilike, inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { accounts, users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

// TODO: MER-18 runs these in CI against a Postgres service
const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";

describe.skipIf(!url)("signing up with an email that has an account", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: Mail[] = [];
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "meritory://",
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
    const takenBody = await taken.json();
    const freshBody = await fresh.json();
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

  it("sends an unconfirmed owner a new link instead", async () => {
    const email = newEmail();
    await signUp(email, "Owner", "violet harbor tractor sandwich");
    await expect.poll(() => mailTo(email).length).toBe(1);

    await signUp(email, "Someone", "maple glacier pencil drum");

    expect(await accountsFor(email)).toHaveLength(1);
    await expect.poll(() => mailTo(email).length).toBe(2);
    expect(mailTo(email)[1]?.text).toMatch(/verify-email/);
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
