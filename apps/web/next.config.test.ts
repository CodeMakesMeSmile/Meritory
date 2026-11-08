import { describe, expect, it } from "vitest";
import config from "./next.config.ts";

describe("next.config", () => {
  it("doesn't say what the server runs", () => {
    expect(config.poweredByHeader).toBe(false);
  });

  it("sends the security headers on every path", async () => {
    const rules = (await config.headers?.()) ?? [];
    const all = rules.find((rule) => rule.source === "/:path*");
    const headers = Object.fromEntries(
      (all?.headers ?? []).map(({ key, value }) => [key, value]),
    );
    expect(headers).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    });
  });

  it("sends no referrer from the reset page, after the general rule", async () => {
    const rules = (await config.headers?.()) ?? [];
    const general = rules.findIndex((rule) => rule.source === "/:path*");
    const reset = rules.findIndex((rule) => rule.source === "/reset-password");
    expect(reset).toBeGreaterThan(general);
    expect(rules[reset]?.headers).toEqual([
      { key: "Referrer-Policy", value: "no-referrer" },
    ]);
  });
});
