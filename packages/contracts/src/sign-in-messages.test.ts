import { ATTACKS } from "@meritory/security-testing";
import { describe, expect, it } from "vitest";
import {
  countdown,
  EMAIL_PATTERN,
  linkedText,
  meterMessage,
  providerNotice,
  signUpFieldFor,
  waitMessage,
} from "./sign-in-messages.ts";

describe("waitMessage", () => {
  it("uses the wait the server sent", () => {
    expect(waitMessage("10")).toBe(
      "Too many tries. Wait 10 seconds, then try again.",
    );
    expect(waitMessage("1")).toBe(
      "Too many tries. Wait 1 second, then try again.",
    );
  });

  it.each([null, "", "0", "-3", "1.5", "soon"])(
    "falls back when the header is %s",
    (header) => {
      expect(waitMessage(header)).toBe(
        "Too many tries. Wait a few seconds, then try again.",
      );
    },
  );
});

describe("EMAIL_PATTERN", () => {
  it.each(["a@b.co", "first.last+tag@example.com"])("accepts %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(true);
  });

  it.each(["", "a", "a@b", "a b@c.co", "a@b .co"])("refuses %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(false);
  });
});

describe("signUpFieldFor", () => {
  it("sends each server code to its field", () => {
    expect(signUpFieldFor("NAME_INVALID")).toBe("name");
    expect(signUpFieldFor("INVALID_EMAIL")).toBe("email");
    expect(signUpFieldFor("PASSWORD_TOO_WEAK")).toBe("password");
  });

  it("leaves other codes to the form message", () => {
    expect(signUpFieldFor("USER_ALREADY_EXISTS")).toBeUndefined();
    expect(signUpFieldFor(undefined)).toBeUndefined();
  });
});

describe("meterMessage", () => {
  const messages = { weak: "Weak", good: "Good" };

  it("prompts before anything is typed", () => {
    expect(meterMessage(null, messages)).toBe("Strength shows as you type");
  });

  it("names a personal password over its strength", () => {
    const check = {
      strength: "weak",
      problem: "personal",
      message: "Leave it out",
    };
    expect(meterMessage(check, messages)).toBe("Leave it out");
  });

  it("shows the strength otherwise", () => {
    const check = { strength: "good", problem: null, message: "ignored" };
    expect(meterMessage(check, messages)).toBe("Good");
  });
});

describe("countdown", () => {
  it("pads the seconds", () => {
    expect(countdown(65)).toBe("1:05");
    expect(countdown(9)).toBe("0:09");
  });
});

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
