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

  it.each(["/reset-password", "/approve-email-change"])(
    "sends no referrer from %s, after the general rule",
    async (page) => {
      const rules = (await config.headers?.()) ?? [];
      const general = rules.findIndex((rule) => rule.source === "/:path*");
      const own = rules.findIndex((rule) => rule.source === page);
      expect(own).toBeGreaterThan(general);
      expect(rules[own]?.headers).toEqual([
        { key: "Referrer-Policy", value: "no-referrer" },
      ]);
    },
  );
});
