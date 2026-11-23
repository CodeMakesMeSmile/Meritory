import { ATTACKS } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmEmail } from "@/lib/confirm-email";

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
);
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ replace: () => {} }),
}));

const { default: ConfirmPage, metadata } = await import("./page.tsx");

const confirm = async (params: Record<string, string | string[]>) =>
  renderToStaticMarkup(
    await ConfirmPage({ searchParams: Promise.resolve(params) }),
  );

describe("confirm email page", () => {
  it("asks for a press before a sign-up is confirmed", async () => {
    const html = await confirm({ token: "abc123" });
    expect(html).toContain("Confirm your email");
    expect(html).toContain(
      "Press Confirm email to finish setting up your account.",
    );
    expect(html).toContain(">Confirm email</button>");
    expect(html).toContain("Back to sign in");
  });

  it("asks for a press before an account moves to a new address", async () => {
    const html = await confirm({ token: "abc123", change: "1" });
    expect(html).toContain("Confirm your new email");
    expect(html).toContain(
      "Press Confirm email to switch your account to this address.",
    );
  });

  it.each([
    ["no token", {}, "/email-confirmed?error=INVALID_TOKEN"],
    ["an empty token", { token: "" }, "/email-confirmed?error=INVALID_TOKEN"],
    [
      "two tokens",
      { token: ["a", "b"] },
      "/email-confirmed?error=INVALID_TOKEN",
    ],
    ["no token on a change", { change: "1" }, "/account?email=failed"],
  ])("sends %s straight to the failed notice", async (_case, params, to) => {
    await expect(confirm(params)).rejects.toThrow(`redirect ${to}`);
  });

  it("keeps the token out of the referrer and search engines", () => {
    expect(metadata.referrer).toBe("no-referrer");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each(ATTACKS)("never writes the token %j into the page", async (token) => {
    if (!token) return;
    const html = await confirm({ token });
    expect(html).toContain("Confirm your email");
    if (/[<>"']/.test(token)) expect(html).not.toContain(token);
  });
});

describe("the press", () => {
  afterEach(() => vi.unstubAllGlobals());

  const answer = (status: number) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status })),
    );

  it("posts the token, so opening the link alone confirms nothing", async () => {
    answer(200);
    await confirmEmail("abc123", "sign-up");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/auth/confirm-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "abc123" }),
      }),
    );
  });

  it.each([
    ["sign-up", 200, "/email-confirmed"],
    ["change", 200, "/account?email=changed"],
    ["sign-up", 400, "/email-confirmed?error=INVALID_TOKEN"],
    ["change", 400, "/account?email=failed"],
    ["change", 403, "/account?email=failed"],
  ] as const)("sends a %s that answers %i to %s", async (kind, status, to) => {
    answer(status);
    expect(await confirmEmail("abc123", kind)).toEqual({ next: to });
  });

  it.each([429, 500, 503])("keeps the button after a %i", async (status) => {
    answer(status);
    expect(await confirmEmail("abc123", "sign-up")).toEqual({
      message: "Something went wrong on our side. Try again in a moment.",
    });
  });

  it("says so when the request never leaves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await confirmEmail("abc123", "change")).toEqual({
      message: "You're offline. Confirming needs a connection.",
    });
  });
});
