import { ATTACKS } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
}));

const { default: ResetPasswordPage } = await import("./page.tsx");
const { default: ForgotPasswordPage } = await import(
  "../forgot-password/page.tsx"
);
const { default: SignInPage } = await import("../sign-in/page.tsx");

const reset = async (params: Record<string, string>) =>
  renderToStaticMarkup(
    await ResetPasswordPage({ searchParams: Promise.resolve(params) }),
  );

const signIn = async (params: Record<string, string>) =>
  renderToStaticMarkup(
    await SignInPage({ searchParams: Promise.resolve(params) }),
  );

describe("reset password page", () => {
  it("asks for the new password twice", async () => {
    const html = await reset({ token: "abc123" });
    expect(html).toContain("Choose a new password");
    expect(html).toContain("Confirm new password");
    expect(html.match(/autocomplete="new-password"/gi)).toHaveLength(2);
  });

  it.each([
    ["a failed link", { error: "INVALID_TOKEN", token: "abc123" }],
    ["no token", {}],
    ["an empty token", { token: "" }],
  ])("shows the expired screen for %s", async (_case, params) => {
    const html = await reset(params);
    expect(html).toContain("This link expired");
    expect(html).toContain("Send a new link");
    expect(html).not.toContain("Choose a new password");
  });

  it.each(ATTACKS)("never writes the token %j into the page", async (token) => {
    const html = await reset({ token });
    expect(html).toContain("Choose a new password");
    if (/[<>"']/.test(token)) expect(html).not.toContain(token);
  });
});

describe("forgot password page", () => {
  it("asks for an email", () => {
    const html = renderToStaticMarkup(ForgotPasswordPage());
    expect(html).toContain("Reset your password");
    expect(html).toContain("Send reset link");
    expect(html).toContain('href="/sign-in"');
  });
});

describe("sign in after a reset", () => {
  it("says the password was saved", async () => {
    expect(await signIn({ reset: "done" })).toContain(
      "Password saved. Sign in with your new password.",
    );
  });

  it.each<Record<string, string>>([{}, { reset: "other" }])(
    "says nothing otherwise, given %j",
    async (params) => {
      expect(await signIn(params)).not.toContain("Password saved");
    },
  );
});
