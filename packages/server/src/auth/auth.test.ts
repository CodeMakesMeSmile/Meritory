import { ATTACKS, CONTROL_ATTACKS } from "@meritory/security-testing";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { createAuth } from "./auth.ts";

// The client connects lazily, and these routes never query with the limiter off
const database = createDatabase("postgres://meritory@127.0.0.1:1/meritory");

const auth = createAuth({
  db: database.db,
  secret: "x".repeat(32),
  baseUrl: "https://meritory.test/api/v1/auth",
  webOrigin: "https://meritory.test",
  appScheme: "app.meritory.mobile://",
  mailer: { send: async () => {} },
  log: { error: () => {} },
  emailLinks: { remember: async () => {}, consume: async () => false },
  rateLimit: false,
});

afterAll(() => database.close());

const post = (
  path: string,
  body: object,
  headers: Record<string, string> = { origin: "https://meritory.test" },
) =>
  auth.handler(
    new Request(`https://meritory.test/api/v1/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );

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

  it.each(["", "   ", ...CONTROL_ATTACKS])(
    "rejects the name %j before touching the database",
    async (name) => {
      const res = await post("/sign-up/email", {
        name,
        email: "anna@example.com",
        password: "violet harbor tractor sandwich",
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ code: "NAME_INVALID" });
    },
  );

  it("rejects a name over 100 characters before touching the database", async () => {
    const long = await post("/sign-up/email", {
      name: "a".repeat(101),
      email: "anna@example.com",
      password: "violet harbor tractor sandwich",
    });
    expect(long.status).toBe(400);
    expect(await long.json()).toMatchObject({
      code: "NAME_INVALID",
      message: "Use 100 characters or fewer.",
    });
  });

  it.each([
    ["GET", "/list-sessions"],
    ["POST", "/revoke-session"],
    ["POST", "/revoke-sessions"],
    ["POST", "/revoke-other-sessions"],
  ])("turns off Better Auth's own %s %s", async (method, path) => {
    const res = await auth.handler(
      new Request(`https://meritory.test/api/v1/auth${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          origin: "https://meritory.test",
          cookie: "better-auth.session_token=abc",
        },
        body: method === "POST" ? JSON.stringify({ token: "abc" }) : undefined,
      }),
    );
    expect(res.status).toBe(404);
  });

  it.each([...ATTACKS, "", "e30.e30.sig", 42, null, { token: "abc" }])(
    "refuses the approval token %j",
    async (token) => {
      const res = await post("/approve-email-change", { token });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ code: "INVALID_TOKEN" });
    },
  );

  it("refuses an email change approval from another site", async () => {
    for (const origin of ["https://evil.example", "null"]) {
      const res = await post(
        "/approve-email-change",
        { token: "abc" },
        { origin, cookie: "better-auth.session_token=abc" },
      );
      expect(res.status).toBe(403);
    }
  });

  it("refuses a Google ID token sent straight to sign-in", async () => {
    const withGoogle = createAuth({
      db: database.db,
      secret: "x".repeat(32),
      baseUrl: "https://meritory.test/api/v1/auth",
      webOrigin: "https://meritory.test",
      appScheme: "app.meritory.mobile://",
      mailer: { send: async () => {} },
      log: { error: () => {} },
      rateLimit: false,
      providers: { google: { clientId: "g-client", clientSecret: "g-secret" } },
    });
    const res = await withGoogle.handler(
      new Request("https://meritory.test/api/v1/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://meritory.test",
        },
        body: JSON.stringify({
          provider: "google",
          idToken: { token: "header.payload.signature" },
        }),
      }),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "ID_TOKEN_NOT_SUPPORTED" });
    expect(res.headers.get("set-cookie") ?? "").not.toContain("session_token=");
  });

  it.each([
    ["sign-in", "/sign-in/email"],
    ["sign-up", "/sign-up/email"],
    ["a new link", "/send-verification-email"],
    ["sign-out", "/sign-out"],
  ])("refuses %s from another site", async (_name, path) => {
    const body = {
      name: "Anna",
      email: "anna@example.com",
      password: "violet harbor tractor sandwich",
    };
    for (const origin of ["https://evil.example", "null"]) {
      const res = await post(path, body, {
        origin,
        cookie: "better-auth.session_token=abc",
      });
      expect(res.status).toBe(403);
    }
  });

  it("only trusts the web origin and the app scheme", () => {
    expect(auth.options.trustedOrigins).toEqual([
      "https://meritory.test",
      "app.meritory.mobile://",
    ]);
  });
});
