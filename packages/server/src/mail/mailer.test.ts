import { describe, expect, it } from "vitest";
import { readSmtpConfig, smtpOptions } from "./mailer.ts";

const ses = {
  SMTP_HOST: "email-smtp.ca-central-1.amazonaws.com",
  SMTP_PORT: "587",
  SMTP_USER: "user",
  SMTP_PASSWORD: "password",
};

describe("smtpOptions", () => {
  it("talks to Mailpit without TLS or a password", () => {
    const options = smtpOptions(readSmtpConfig({}));
    expect(options).toMatchObject({
      host: "localhost",
      port: 1025,
      secure: false,
      requireTLS: false,
    });
    expect(options.auth).toBeUndefined();
    for (const host of ["127.0.0.1", "::1"]) {
      expect(smtpOptions(readSmtpConfig({ SMTP_HOST: host })).requireTLS).toBe(
        false,
      );
    }
  });

  it("refuses to send to any other server unless STARTTLS works", () => {
    expect(smtpOptions(readSmtpConfig(ses))).toMatchObject({
      secure: false,
      requireTLS: true,
      auth: { user: "user", pass: "password" },
    });
    for (const host of ["mailpit.evil.example", "localhost.evil.example"]) {
      expect(smtpOptions(readSmtpConfig({ SMTP_HOST: host })).requireTLS).toBe(
        true,
      );
    }
  });

  it("starts with TLS on port 465", () => {
    expect(
      smtpOptions(readSmtpConfig({ ...ses, SMTP_PORT: "465" })),
    ).toMatchObject({ secure: true, requireTLS: false });
  });
});
