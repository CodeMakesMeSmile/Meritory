import { randomUUID } from "node:crypto";
import { ATTACKS, CONTROL_ATTACKS } from "@meritory/security-testing";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { users } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";

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

  const nameOf = async (email: string) => {
    const [row] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, email));
    return row?.name;
  };

  afterAll(async () => {
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
});
