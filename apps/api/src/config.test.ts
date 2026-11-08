import { describe, expect, it } from "vitest";
import { readConfig } from "./config.ts";

const base = {
  DATABASE_URL: "postgres://localhost/meritory",
  BETTER_AUTH_SECRET: "x".repeat(32),
  MAIL_JOB_KEY: Buffer.alloc(32, 1).toString("base64"),
};

describe("readConfig", () => {
  it("refuses to start without a long enough secret", () => {
    expect(() => readConfig({ ...base, BETTER_AUTH_SECRET: "" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
    expect(() =>
      readConfig({ ...base, BETTER_AUTH_SECRET: "x".repeat(31) }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("refuses to start without a 32-byte mail key", () => {
    expect(() => readConfig({ ...base, MAIL_JOB_KEY: "" })).toThrow(
      /MAIL_JOB_KEY/,
    );
    expect(() =>
      readConfig({
        ...base,
        MAIL_JOB_KEY: Buffer.alloc(16, 1).toString("base64"),
      }),
    ).toThrow(/MAIL_JOB_KEY/);
    expect(readConfig(base).mailJobKey).toHaveLength(32);
  });

  it("turns on a provider only when both its ID and secret are set", () => {
    const config = readConfig({
      ...base,
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "",
    });
    expect(config.providers.github).toEqual({
      clientId: "id",
      clientSecret: "secret",
    });
    expect(config.providers.google).toBeUndefined();
  });

  it("serves auth under the web origin", () => {
    const config = readConfig({
      ...base,
      WEB_ORIGIN: "http://localhost:3000/",
    });
    expect(config.webOrigin).toBe("http://localhost:3000");
    expect(config.publicApiUrl).toBe("http://localhost:3000/api");
  });

  it("only allows localhost outside production", () => {
    expect(readConfig(base).webOrigin).toBe("http://localhost:3000");
    expect(() => readConfig({ ...base, NODE_ENV: "production" })).toThrow(
      /WEB_ORIGIN/,
    );
    expect(() =>
      readConfig({
        ...base,
        NODE_ENV: "production",
        WEB_ORIGIN: "http://localhost:3000",
      }),
    ).toThrow(/public https/);
    expect(
      readConfig({
        ...base,
        NODE_ENV: "production",
        WEB_ORIGIN: "https://meritory.app",
      }).webOrigin,
    ).toBe("https://meritory.app");
  });

  it("reads proxy settings as lists", () => {
    const config = readConfig({
      ...base,
      AUTH_IP_HEADERS: "",
      AUTH_TRUSTED_PROXIES: "10.0.0.1, 10.0.0.2",
    });
    expect(config.ipAddressHeaders).toEqual([]);
    expect(config.trustedProxies).toEqual(["10.0.0.1", "10.0.0.2"]);
    expect(readConfig(base).ipAddressHeaders).toBeUndefined();
  });
});
