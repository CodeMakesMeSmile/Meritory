import { EMAIL_ATTACKS, HTML_ATTACKS } from "@meritory/security-testing";
import { describe, expect, it } from "vitest";
import { escapeHtml } from "./email-layout.ts";
import {
  accountDeleted,
  approveEmailChange,
  confirmNewEmail,
  emailChanged,
  emailInUse,
  existingAccount,
  finishSignUp,
  passwordChanged,
  providerLinked,
  providerUnlinked,
  resetPassword,
  verifyEmail,
} from "./emails.ts";

const TO = "rowan@meritory.test";
const NEXT = "rowan.new@meritory.test";
const ORIGIN = "https://meritory.test";
const LINK = `${ORIGIN}/confirm-email?token=abc`;

const notices = () => [
  passwordChanged(TO, ORIGIN),
  existingAccount(TO, ORIGIN),
  providerLinked(TO, "GitHub", ORIGIN),
  providerUnlinked(TO, "GitHub", ORIGIN),
  emailInUse(TO, ORIGIN),
  emailChanged(TO, NEXT),
  accountDeleted(TO, ORIGIN),
];

describe("emails", () => {
  it("gives the five action emails a button with the link", () => {
    for (const [mail, button] of [
      [verifyEmail(TO, LINK), "Confirm email"],
      [finishSignUp(TO, LINK), "Choose your password"],
      [resetPassword(TO, LINK), "Choose a new password"],
      [approveEmailChange(TO, NEXT, LINK, ORIGIN), "Approve change"],
      [confirmNewEmail(TO, LINK), "Confirm new email"],
    ] as const) {
      expect(mail.text).toContain(`${button}: ${LINK}`);
      expect(mail.html).toContain(`>${button}</a>`);
      expect(mail.html).toContain(`>${LINK}</a>`);
    }
  });

  it("sends notices to our own pages, never with a token", () => {
    for (const mail of notices()) {
      expect(mail.html).not.toContain("Or paste this link");
      expect(mail.text).not.toMatch(/token=/);
      for (const url of mail.text.match(/https?:\/\/\S+/g) ?? []) {
        if (url === NEXT) continue;
        expect(url.startsWith(`${ORIGIN}/`)).toBe(true);
      }
    }
  });

  it("names the new address in both email change notices", () => {
    expect(approveEmailChange(TO, NEXT, LINK, ORIGIN).text).toContain(NEXT);
    expect(emailChanged(TO, NEXT).text).toContain(`is now ${NEXT}`);
  });

  it("escapes the new address, which the person typed", () => {
    for (const attack of [...HTML_ATTACKS, ...EMAIL_ATTACKS]) {
      for (const mail of [
        approveEmailChange(TO, attack, LINK, ORIGIN),
        emailChanged(TO, attack),
      ]) {
        expect(mail.html).toContain(escapeHtml(attack));
        if (attack !== escapeHtml(attack)) {
          expect(mail.html).not.toContain(attack);
        }
      }
    }
  });

  it("addresses each one to the account and says so in the footer", () => {
    for (const mail of [
      verifyEmail(TO, LINK),
      finishSignUp(TO, LINK),
      resetPassword(TO, LINK),
      approveEmailChange(TO, NEXT, LINK, ORIGIN),
      confirmNewEmail(TO, LINK),
      ...notices(),
    ]) {
      expect(mail.to).toBe(TO);
      expect(mail.text.endsWith(`Sent to ${TO} by Meritory.`)).toBe(true);
    }
  });
});
