import { ATTACKS } from "@meritory/security-testing";
import { describe, expect, it } from "vitest";
import { linkedText, providerNotice } from "./providers.ts";

describe("linkedText", () => {
  it("names the provider that was just linked", () => {
    expect(linkedText("github")).toBe(
      "GitHub is now linked to your account. You can sign in with it too.",
    );
  });

  it.each<string | string[] | undefined>([
    undefined,
    "",
    "gitlab",
    ["github"],
    ...ATTACKS,
  ])("stays quiet for %j", (linked) => {
    expect(linkedText(linked)).toBeNull();
  });
});

describe("providerNotice", () => {
  it.each([
    ["access_denied", "info", "You cancelled signing in with GitHub."],
    ["email_not_found", "danger", "Your GitHub account has no verified email."],
    ["email_not_verified", "danger", "Verify one on GitHub, then try again."],
    ["account_not_linked", "info", "Reset its password to confirm it"],
    ["state_mismatch", "danger", "GitHub sign-in didn't work. Try again."],
  ])("explains %s", (error, tone, text) => {
    const notice = providerNotice("github", error);
    expect(notice?.tone).toBe(tone);
    expect(notice?.text).toContain(text);
  });

  it("offers the reset only for an account that isn't confirmed", () => {
    expect(providerNotice("google", "account_not_linked")?.reset).toBe(true);
    expect(providerNotice("google", "access_denied")?.reset).toBeUndefined();
  });

  it("says nothing changed when they cancel from Account", () => {
    expect(providerNotice("google", "access_denied", "account")?.text).toBe(
      "You cancelled on Google. Nothing changed.",
    );
  });

  it.each<[string | string[] | undefined, string | string[] | undefined]>([
    [undefined, "access_denied"],
    ["github", undefined],
    ["gitlab", "access_denied"],
    [["github"], "access_denied"],
    ["github", ["access_denied"]],
  ])("stays quiet for provider %j and error %j", (provider, error) => {
    expect(providerNotice(provider, error)).toBeNull();
  });

  it.each(ATTACKS)("never repeats the error %j", (error) => {
    expect(providerNotice("github", error)?.text).not.toContain(error);
  });
});
