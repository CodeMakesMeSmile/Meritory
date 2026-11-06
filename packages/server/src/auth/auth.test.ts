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
      maxPasswordLength: 128,
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

  it("only trusts the web origin and the app scheme", () => {
    expect(auth.options.trustedOrigins).toEqual([
      "https://meritory.test",
      "meritory://",
    ]);
  });
});
