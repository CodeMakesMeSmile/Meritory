import type { MeResponse } from "@meritory/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
}));

const me = vi.hoisted(() => ({ current: null as MeResponse | null }));
vi.mock("@/lib/me", () => ({ requireMe: async () => me.current }));

const { default: AccountPage } = await import("./page.tsx");
const { ConfirmItsYou } = await import("./confirm-its-you.tsx");

const account = async (
  signInMethods: MeResponse["signInMethods"],
  params: Record<string, string> = {},
) => {
  me.current = {
    id: "0b6f3c1e-8a3d-4f7a-9c2e-5d1b7e9f0a12",
    name: "Rowan Lee",
    email: "rowan@meritory.test",
    signInMethods,
  };
  return renderToStaticMarkup(
    await AccountPage({ searchParams: Promise.resolve(params) }),
  );
};

const githubOnly = { password: false, providers: ["github" as const] };

describe("Account without a password", () => {
  it("offers to email a link instead of asking for the current password", async () => {
    const html = await account(githubOnly);
    expect(html).toContain("No password set.");
    expect(html).toContain("You sign in with GitHub, so there");
    expect(html).toContain("Email me a link");
    expect(html).not.toContain("Current password");
  });

  it("shows why GitHub sent them back", async () => {
    const html = await account(githubOnly, {
      provider: "github",
      error: "access_denied",
    });
    expect(html).toContain(
      "You cancelled signing in with GitHub. Nothing changed.",
    );
  });

  it("says nothing for an unknown provider", async () => {
    const html = await account(githubOnly, {
      provider: "evil",
      error: "access_denied",
    });
    expect(html).not.toContain("You cancelled");
  });
});

describe("Account with a password", () => {
  it("still asks for the current password", async () => {
    const html = await account({ password: true, providers: ["google"] });
    expect(html).toContain("Current password");
    expect(html).not.toContain("Email me a link");
  });

  it("says Google was just linked, as a success", async () => {
    const html = await account(
      { password: true, providers: ["google"] },
      { linked: "google" },
    );
    expect(html).toContain(
      "Google is now linked to your account. You can sign in with it too.",
    );
    expect(html).toContain('role="status"');
  });
});

describe("Confirm it's you", () => {
  const confirm = (provider: "github" | null) =>
    renderToStaticMarkup(
      <ConfirmItsYou
        open
        provider={provider}
        signedInAt={null}
        onCancel={() => {}}
        onConfirmed={() => {}}
      />,
    );

  it("asks to sign in with GitHub again when there's no password", () => {
    const html = confirm("github");
    expect(html).toContain("Sign in with GitHub again to keep going.");
    expect(html).toContain("Continue with GitHub");
    expect(html).not.toContain("Continue with Google");
    expect(html).not.toContain('type="password"');
  });

  it("asks for the password otherwise", () => {
    const html = confirm(null);
    expect(html).toContain("Enter your password to keep going.");
    expect(html).not.toContain("Continue with GitHub");
  });
});
