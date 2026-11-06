import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy.ts";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });

const SESSION = "better-auth.session_token=abc";

describe("proxy", () => {
  it("sends a page a policy with a fresh nonce", () => {
    const first = proxy(request("/sign-in"));
    const second = proxy(request("/sign-in"));
    const policy = first.headers.get("content-security-policy") ?? "";
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(policy).toContain("frame-ancestors 'none'");
    expect(second.headers.get("content-security-policy")).not.toBe(policy);
  });

  it("hands the same nonce to the page it renders", () => {
    const res = proxy(request("/", SESSION));
    const policy = res.headers.get("content-security-policy") ?? "";
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    // Next passes rewritten request headers on with this prefix
    expect(res.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(
      res.headers.get("x-middleware-request-content-security-policy"),
    ).toBe(policy);
  });

  it("sends people without a session to sign in, keeping where they were", () => {
    const res = proxy(request("/practice?track=dsa"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?next=%2Fpractice%3Ftrack%3Ddsa",
    );
  });

  it("lets public pages through without a session", () => {
    expect(proxy(request("/sign-up")).status).toBe(200);
  });
});
