import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
}));

const { default: SignInPage } = await import("./page.tsx");
const { default: SignUpPage } = await import("../sign-up/page.tsx");

const signIn = async (params: Record<string, string>) =>
  renderToStaticMarkup(
    await SignInPage({ searchParams: Promise.resolve(params) }),
  );

describe("GitHub and Google buttons", () => {
  it("sit above the email form on sign in", async () => {
    const html = await signIn({});
    const github = html.indexOf("Continue with GitHub");
    expect(github).toBeGreaterThan(-1);
    expect(html.indexOf("Continue with Google")).toBeGreaterThan(github);
    expect(html.indexOf('type="email"')).toBeGreaterThan(github);
  });

  it("are on sign up too", () => {
    const html = renderToStaticMarkup(SignUpPage());
    expect(html).toContain("Continue with GitHub");
    expect(html).toContain("Continue with Google");
  });

  it("offer the reset for an account that isn't confirmed", async () => {
    const html = await signIn({
      provider: "google",
      error: "account_not_linked",
    });
    expect(html).toContain("Reset its password to confirm it");
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain("Reset password");
  });

  it("explain a GitHub account with no verified email", async () => {
    const html = await signIn({ provider: "github", error: "email_not_found" });
    expect(html).toContain("Your GitHub account has no verified email.");
    expect(html).toContain('role="alert"');
  });
});
