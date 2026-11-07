import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { users, verifications } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";
import { createEmailLinks } from "./email-links.ts";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("email links against Postgres", () => {
  const database = createDatabase(url ?? "");
  const links = createEmailLinks(database.db);
  const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000);

  afterAll(async () => {
    await database.db
      .delete(verifications)
      .where(like(verifications.identifier, "email-link:test-%"));
    await database.db
      .delete(users)
      .where(like(users.email, "email-links-%@meritory.test"));
    await database.close();
  });

  it("lets each link through once", async () => {
    await links.remember("test-once", "token-once", inAnHour());
    expect(await links.consume("token-once")).toBe(true);
    expect(await links.consume("token-once")).toBe(false);
  });

  it("cancels the old link when a new one is sent", async () => {
    await links.remember("test-new", "token-old", inAnHour());
    await links.remember("test-new", "token-new", inAnHour());
    expect(await links.consume("token-old")).toBe(false);
    expect(await links.consume("token-new")).toBe(true);
  });

  it("refuses a link past its hour", async () => {
    await links.remember(
      "test-late",
      "token-late",
      new Date(Date.now() - 1000),
    );
    expect(await links.consume("token-late")).toBe(false);
  });

  it("verifies through the real route once, then sends the next try to the expired page", async () => {
    const sent: Mail[] = [];
    const auth = createAuth({
      db: database.db,
      secret: "x".repeat(32),
      baseUrl: "https://meritory.test/api/v1/auth",
      webOrigin: "https://meritory.test",
      appScheme: "meritory://",
      mailer: { send: async (mail) => void sent.push(mail) },
      log: { error: () => {} },
    });
    const email = `email-links-${randomUUID()}@meritory.test`;

    const signUp = await auth.handler(
      new Request("https://meritory.test/api/v1/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://meritory.test",
        },
        body: JSON.stringify({
          name: "Test",
          email,
          password: "violet harbor tractor sandwich",
        }),
      }),
    );
    expect(signUp.status).toBe(200);

    await expect.poll(() => sent.length).toBe(1);
    const link = sent[0]?.text.match(/https:\/\/\S+verify-email\S+/)?.[0] ?? "";
    expect(link).toContain("callbackURL=%2Femail-confirmed");

    const first = await auth.handler(new Request(link));
    expect(first.headers.get("location")).toBe("/email-confirmed");
    const [user] = await database.db
      .select({ verified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email));
    expect(user?.verified).toBe(true);

    const second = await auth.handler(new Request(link));
    expect(second.headers.get("location")).toBe(
      "/email-confirmed?error=INVALID_TOKEN",
    );
  });
});
