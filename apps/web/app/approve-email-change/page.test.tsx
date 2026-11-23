import { ATTACKS } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
);
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ replace: () => {} }),
}));

const { default: ApprovePage, metadata } = await import("./page.tsx");

const approve = async (params: Record<string, string | string[]>) =>
  renderToStaticMarkup(
    await ApprovePage({ searchParams: Promise.resolve(params) }),
  );

describe("approve email change page", () => {
  it("asks for a press before anything changes", async () => {
    const html = await approve({ token: "abc123" });
    expect(html).toContain("Approve your new email");
    expect(html).toContain(
      "Press Approve to send a confirmation link to your new address.",
    );
    expect(html).toContain(">Approve</button>");
  });

  it.each([
    ["no token", {}],
    ["an empty token", { token: "" }],
    ["two tokens", { token: ["a", "b"] }],
  ])("sends %s straight to the failed notice", async (_case, params) => {
    await expect(approve(params)).rejects.toThrow(
      "redirect /account?email=failed",
    );
  });

  it("keeps the token out of the referrer and search engines", () => {
    expect(metadata.referrer).toBe("no-referrer");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each(ATTACKS)("never writes the token %j into the page", async (token) => {
    if (!token) return;
    const html = await approve({ token });
    expect(html).toContain("Approve your new email");
    if (/[<>"']/.test(token)) expect(html).not.toContain(token);
  });
});
