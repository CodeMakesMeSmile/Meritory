import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { createAuth } from "./auth.ts";

// The client connects lazily, and these routes never query
const database = createDatabase("postgres://meritory@127.0.0.1:1/meritory");

const auth = createAuth({
  db: database.db,
  secret: "x".repeat(32),
  baseUrl: "https://meritory.test/api/v1/auth",
  webOrigin: "https://meritory.test",
  appScheme: "meritory://",
  mailer: { send: async () => {} },
  log: { error: () => {} },
  emailLinks: { remember: async () => {}, consume: async () => false },
});

afterAll(() => database.close());

describe("createAuth", () => {
  it("answers on the public path", async () => {
    const res = await auth.handler(
      new Request("https://meritory.test/api/v1/auth/ok"),
    );
    expect(res.status).toBe(200);
  });

  it("applies the password and link rules", () => {
    const options = auth.options;
    expect(options.emailAndPassword).toMatchObject({
      minPasswordLength: 16,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
    });
    expect(options.emailVerification?.expiresIn).toBe(3600);
    expect(options.rateLimit).toMatchObject({
      storage: "database",
      customRules: { "/sign-in/email": { window: 10, max: 3 } },
    });
  });

  it("rejects weak and personal passwords before touching the database", async () => {
    const signUp = (password: string) =>
      auth.handler(
        new Request("https://meritory.test/api/v1/auth/sign-up/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://meritory.test",
          },
          body: JSON.stringify({
            name: "Anna",
            email: "anna@example.com",
            password,
          }),
        }),
      );

    const weak = await signUp("aaaaaaaaaaaaaaaa");
    expect(weak.status).toBe(400);
    expect(await weak.json()).toMatchObject({ code: "PASSWORD_TOO_WEAK" });

    const personal = await signUp("anna keeps forgetting things");
    expect(await personal.json()).toMatchObject({ code: "PASSWORD_PERSONAL" });

    const emoji = await signUp("🙂".repeat(8));
    expect(await emoji.json()).toMatchObject({
      code: "PASSWORD_TOO_SHORT",
      message: "Use at least 16 characters. You have 8.",
    });
  });

  it("sends a used or unknown link to the expired page", async () => {
    const res = await auth.handler(
      new Request(
        "https://meritory.test/api/v1/auth/verify-email?token=unknown&callbackURL=%2Femail-confirmed",
      ),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "/email-confirmed?error=INVALID_TOKEN",
    );
  });

  it("only trusts the web origin and the app scheme", () => {
    expect(auth.options.trustedOrigins).toEqual([
      "https://meritory.test",
      "meritory://",
    ]);
  });
});
