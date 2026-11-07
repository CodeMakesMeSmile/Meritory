import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, createNonce } from "./csp.ts";

const directives = (policy: string) =>
  new Map(
    policy.split("; ").map((d) => {
      const [name = "", ...values] = d.split(" ");
      return [name, values];
    }),
  );

describe("contentSecurityPolicy", () => {
  it("only runs scripts and styles that carry the nonce", () => {
    const policy = directives(contentSecurityPolicy("abc", false));
    expect(policy.get("script-src")).toEqual([
      "'self'",
      "'nonce-abc'",
      "'strict-dynamic'",
    ]);
    expect(policy.get("style-src")).toEqual(["'self'", "'nonce-abc'"]);
  });

  it("never allows inline code or eval in production", () => {
    const policy = contentSecurityPolicy("abc", false);
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("blocks framing, plugins, and other sites", () => {
    const policy = directives(contentSecurityPolicy("abc", false));
    expect(policy.get("default-src")).toEqual(["'self'"]);
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
    expect(policy.get("object-src")).toEqual(["'none'"]);
    expect(policy.get("base-uri")).toEqual(["'self'"]);
    expect(policy.get("form-action")).toEqual(["'self'"]);
  });

  it("loosens only what the dev server needs", () => {
    const policy = directives(contentSecurityPolicy("abc", true));
    expect(policy.get("script-src")).toContain("'unsafe-eval'");
    expect(policy.get("style-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
  });
});

describe("createNonce", () => {
  it("is 128 random bits in base64", () => {
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });

  it("is different every time", () => {
    const nonces = new Set(Array.from({ length: 1000 }, createNonce));
    expect(nonces.size).toBe(1000);
  });
});
