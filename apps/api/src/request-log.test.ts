import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { loggedUrl, loggerOptions } from "./request-log.ts";

describe("logged addresses", () => {
  it.each([
    ["/v1/auth/verify-email?token=SECRET", "/v1/auth/verify-email"],
    [
      "/v1/auth/reset-password/SECRET?callbackURL=/reset",
      "/v1/auth/reset-password/[token]",
    ],
    [
      "/v1/auth/callback/google?code=SECRET&state=SECRET",
      "/v1/auth/callback/google",
    ],
    ["/v1/auth/reset-password", "/v1/auth/reset-password"],
    ["/v1/health/live", "/v1/health/live"],
  ])("writes %s as %s", (url, logged) => {
    expect(loggedUrl(url)).toBe(logged);
  });
});

describe("the request log", () => {
  let app: ReturnType<typeof Fastify> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("holds no token from a sign-in link", async () => {
    const lines: string[] = [];
    app = Fastify({
      logger: loggerOptions("info", { write: (line) => lines.push(line) }),
    });
    app.get("/*", async () => "ok");

    for (const url of [
      "/v1/auth/verify-email?token=SECRET-CONFIRM",
      "/v1/auth/reset-password/SECRET-RESET?callbackURL=%2Freset",
      "/v1/auth/callback/google?code=SECRET-CODE&state=SECRET-STATE",
    ]) {
      await app.inject(url);
    }

    const log = lines.join("");
    expect(log).toContain("/v1/auth/verify-email");
    expect(log).toContain("/v1/auth/reset-password/[token]");
    expect(log).toContain("/v1/auth/callback/google");
    expect(log).not.toContain("SECRET");
  });
});
