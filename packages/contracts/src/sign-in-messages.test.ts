import { describe, expect, it } from "vitest";
import {
  countdown,
  EMAIL_PATTERN,
  meterMessage,
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
