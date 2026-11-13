import type { MeResponse } from "@meritory/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));

const me = vi.hoisted(() => ({ current: null as MeResponse | null }));
vi.mock("@/lib/me", () => ({ requireMe: async () => me.current }));

const { default: AccountPage } = await import("./page.tsx");
const { ConfirmItsYou } = await import("./confirm-its-you.tsx");
const { onlyWayText, stillWorksText } = await import("./methods-card.tsx");
const { deleteText } = await import("./delete-card.tsx");

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

const linked = (id: "github" | "google") => ({
  id,
  linkedAt: "2026-11-03T12:00:00.000Z",
});
const both = ["github", "google"] as ("github" | "google")[];
const githubOnly = {
  passwordSetAt: null,
  providers: [linked("github")],
  available: both,
};
const withPassword = {
  passwordSetAt: "2026-11-03T12:00:00.000Z",
  providers: [linked("google")],
  available: both,
};

describe("Profile", () => {
  it("comes first, with the name to edit and the email", async () => {
    const html = await account(withPassword);
    const profile = html.indexOf("Profile");
    expect(profile).toBeGreaterThan(-1);
    expect(html.indexOf("Sign-in methods")).toBeGreaterThan(profile);
    expect(html).toContain("What should we call you?");
    expect(html).toContain('value="Rowan Lee"');
    expect(html).toContain("Save name");
    expect(html).toContain("rowan@meritory.test");
    expect(html).toContain("Change email");
    // The form only opens from the button
    expect(html).not.toContain("New email");
  });

  it.each([
    [{ email: "approved" }, "Change approved. Now open the link"],
    [{ email: "changed" }, "Your email is now rowan@meritory.test."],
    [{ email: "failed" }, "That link didn&#x27;t work"],
    [{ email: "changed", error: "INVALID_USER" }, "That link didn&#x27;t work"],
  ])("says where the emailed link left off for %j", async (params, text) => {
    const html = await account(withPassword, params);
    expect(html).toContain(text);
  });

  it("says nothing about an unknown step", async () => {
    const html = await account(withPassword, { email: "<b>done</b>" });
    expect(html).not.toContain("That link didn");
    expect(html).not.toContain("<b>done</b>");
  });
});

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
    expect(html).toContain("You cancelled on GitHub. Nothing changed.");
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
    const html = await account(withPassword);
    expect(html).toContain("Current password");
    expect(html).not.toContain("Email me a link");
  });

  it("says Google was just linked, as a success", async () => {
    const html = await account(withPassword, { linked: "google" });
    expect(html).toContain(
      "Google is now linked to your account. You can sign in with it too.",
    );
    expect(html).toContain('role="status"');
  });
});

describe("Sign-in methods", () => {
  it("lists every method, and offers the right action on each", async () => {
    const html = await account(withPassword);
    expect(html).toContain("Email and password");
    expect(html).toContain("Link GitHub");
    expect(html).toContain("Not linked");
    expect(html).toContain('aria-label="Unlink Google"');
    expect(html).not.toContain("Unlink Email");
  });

  it("leaves out a provider this server can't link", async () => {
    const html = await account({
      ...withPassword,
      providers: [],
      available: ["google"],
    });
    expect(html).toContain("Link Google");
    expect(html).not.toContain("GitHub");
  });

  it("still shows a linked provider whose credentials were removed", async () => {
    const html = await account({
      ...withPassword,
      providers: [linked("github")],
      available: [],
    });
    expect(html).toContain('aria-label="Unlink GitHub"');
  });

  it("turns off Unlink for the only method, and says why", async () => {
    const html = await account(githubOnly);
    expect(html).toMatch(/aria-disabled="true"[^>]*aria-label="Unlink GitHub"/);
    expect(html).toContain('aria-describedby="only-github"');
    expect(html).toContain(
      "GitHub is your only way to sign in. Link Google or set a password before unlinking it.",
    );
  });

  it("names the account's email when GitHub's doesn't match", async () => {
    const html = await account(withPassword, {
      provider: "github",
      error: "email_does_not_match",
    });
    expect(html).toContain(
      "That GitHub account uses a different email. Link one that uses rowan@meritory.test.",
    );
  });

  it("only offers the set a password fix when nothing else can be linked", () => {
    expect(onlyWayText("GitHub", [])).toBe(
      "GitHub is your only way to sign in. Set a password before unlinking it.",
    );
  });

  it("says what still works after an unlink", () => {
    expect(stillWorksText(true, [])).toBe("Email and password still works.");
    expect(stillWorksText(false, ["Google"])).toBe("Google still works.");
    expect(stillWorksText(true, ["Google"])).toBe(
      "Google and your email and password still work.",
    );
  });
});

describe("Delete account", () => {
  it("comes last, with a red button that only opens the question", async () => {
    const html = await account(withPassword);
    const card = html.indexOf("Delete account");
    expect(card).toBeGreaterThan(html.indexOf("Password"));
    expect(html).toContain(
      "This removes your practice history, sessions, and sign-in methods. It can&#x27;t be undone.",
    );
    expect(html).toMatch(/border-danger[^"]*text-danger[^>]*>Delete account</);
    // The dialog's words render only once it opens
    expect(html).not.toContain("Delete my account");
  });

  it.each([
    [
      3,
      2,
      "Your practice history, 3 sessions, and 2 sign-in methods will be removed for good. This can't be undone.",
    ],
    [
      1,
      1,
      "Your practice history, 1 session, and 1 sign-in method will be removed for good. This can't be undone.",
    ],
    [
      null,
      2,
      "Your practice history, sessions, and 2 sign-in methods will be removed for good. This can't be undone.",
    ],
  ])(
    "names what goes for %j sessions and %j methods",
    (sessions, methods, text) => {
      expect(deleteText(sessions, methods)).toBe(text);
    },
  );
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
