import { describe, expect, it } from "vitest";
import {
  existingAccount,
  passwordChanged,
  resetPassword,
  verifyEmail,
} from "./emails.ts";

const TO = "rowan@meritory.test";
const ORIGIN = "https://meritory.test";
const LINK = `${ORIGIN}/api/v1/auth/verify-email?token=abc`;

describe("emails", () => {
  it("gives the four action emails a button with the link", () => {
    for (const [mail, button] of [
      [verifyEmail(TO, LINK), "Confirm email"],
      [resetPassword(TO, LINK), "Choose a new password"],
    ] as const) {
      expect(mail.text).toContain(`${button}: ${LINK}`);
      expect(mail.html).toContain(`>${button}</a>`);
      expect(mail.html).toContain(`>${LINK}</a>`);
    }
  });

  it("sends notices to our own pages, never with a token", () => {
    for (const mail of [
      passwordChanged(TO, ORIGIN),
      existingAccount(TO, ORIGIN),
    ]) {
      expect(mail.text).toContain(`${ORIGIN}/forgot-password`);
      expect(mail.html).not.toContain("Or paste this link");
      expect(mail.text).not.toMatch(/token=/);
    }
    expect(existingAccount(TO, ORIGIN).text).toContain(
      `Sign in: ${ORIGIN}/sign-in`,
    );
  });

  it("addresses each one to the account and says so in the footer", () => {
    for (const mail of [
      verifyEmail(TO, LINK),
      resetPassword(TO, LINK),
      passwordChanged(TO, ORIGIN),
      existingAccount(TO, ORIGIN),
    ]) {
      expect(mail.to).toBe(TO);
      expect(mail.text.endsWith(`Sent to ${TO} by Meritory.`)).toBe(true);
    }
  });
});
