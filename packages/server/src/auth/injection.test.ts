import { randomUUID } from "node:crypto";
import {
  ATTACKS,
  EMAIL_ATTACKS,
  SQL_ATTACKS,
} from "@meritory/security-testing";
import { count, eq, inArray, like, or } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { accounts, sessions, users, verifications } from "../db/schema.ts";
import { createAuth } from "./auth.ts";
import { createEmailLinks } from "./email-links.ts";

const url = process.env.TEST_DATABASE_URL;

const PASSWORD = "violet harbor tractor sandwich";
const ORIGIN = "https://meritory.test";

describe.skipIf(!url)("attack strings against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const links = createEmailLinks(db);
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "meritory://",
    mailer: { send: async () => {} },
    log: { error: () => {} },
    // Dozens of tries in a row would trip it, and the limiter has its own tests
    rateLimit: false,
  });

  const post = (path: string, body: object) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify(body),
      }),
    );

  // One real account, so a query that matched everything would find it
  const owner = `injection-${randomUUID()}@meritory.test`;

  // Only this file's rows, since other test files write to the same tables at once
  const rows = async () => {
    const account = await db
      .select({ user: users, password: accounts.password })
      .from(users)
      .innerJoin(accounts, eq(accounts.userId, users.id))
      .where(eq(users.email, owner));
    const [mine] = await db
      .select({ n: count() })
      .from(users)
      .where(like(users.email, "injection-%"));
    const [signedIn] = await db
      .select({ n: count() })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(like(users.email, "injection-%"));
    const [pending] = await db
      .select({ n: count() })
      .from(verifications)
      .where(like(verifications.identifier, "email-link:injection-%"));
    return {
      account,
      users: mine?.n,
      sessions: signedIn?.n,
      links: pending?.n,
    };
  };

  beforeAll(async () => {
    expect(
      (
        await post("/sign-up/email", {
          name: "Owner",
          email: owner,
          password: PASSWORD,
        })
      ).status,
    ).toBe(200);
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, owner));
  });

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "injection-%@meritory.test"));
    await db.delete(verifications).where(
      or(
        like(verifications.identifier, "email-link:injection-%"),
        inArray(
          verifications.identifier,
          mine.map(({ id }) => `email-link:${id}`),
        ),
      ),
    );
    await db
      .delete(users)
      .where(like(users.email, "injection-%@meritory.test"));
    await database.close();
  });

  it.each(ATTACKS)(
    "sign-in with %j as the email or password finds no one",
    async (attack) => {
      const before = await rows();
      for (const body of [
        { email: attack, password: attack },
        { email: owner, password: attack },
      ]) {
        const res = await post("/sign-in/email", body);
        expect([400, 401]).toContain(res.status);
        expect(res.headers.get("set-cookie") ?? "").not.toContain(
          "session_token=",
        );
      }
      expect(await rows()).toEqual(before);
    },
  );

  it.each(EMAIL_ATTACKS)(
    "sign-in with the valid address %j finds no one",
    async (email) => {
      const before = await rows();
      const res = await post("/sign-in/email", { email, password: PASSWORD });
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({
        code: "INVALID_EMAIL_OR_PASSWORD",
      });
      expect(await rows()).toEqual(before);
    },
  );

  it.each(ATTACKS)("stores the name %j exactly as typed", async (name) => {
    const email = `injection-${randomUUID()}@meritory.test`;
    const res = await post("/sign-up/email", {
      name,
      email,
      password: PASSWORD,
    });
    expect(res.status).toBe(200);
    const [saved] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, email));
    expect(saved?.name).toBe(name);
  });

  it.each(SQL_ATTACKS)(
    "a verification token of %j matches no link",
    async (token) => {
      await links.remember(
        `injection-${randomUUID()}`,
        `real-${randomUUID()}`,
        new Date(Date.now() + 60_000),
      );
      const before = await rows();
      expect(await links.consume(token)).toBe(false);
      const res = await auth.handler(
        new Request(
          `${ORIGIN}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=%2Femail-confirmed`,
        ),
      );
      expect(res.headers.get("location")).toBe(
        "/email-confirmed?error=INVALID_TOKEN",
      );
      expect(await rows()).toEqual(before);
    },
  );

  it("leaves the tables in place", async () => {
    const [found] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.email, owner));
    expect(found?.email).toBe(owner);
  });
});
