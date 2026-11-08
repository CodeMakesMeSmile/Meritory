import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  openMail,
  readMailKey,
  sealMail,
  UnreadableMailError,
} from "./mail-crypto.ts";

const key = randomBytes(32);
const mail = {
  to: "rowan@meritory.test",
  subject: "Reset your Meritory password",
  text: "https://meritory.test/reset-password/abc123",
};

describe("readMailKey", () => {
  it("takes exactly 32 bytes of base64", () => {
    expect(readMailKey(key.toString("base64"))).toEqual(key);
    for (const value of [undefined, "", randomBytes(16).toString("base64")]) {
      expect(() => readMailKey(value)).toThrow(/MAIL_JOB_KEY/);
    }
  });
});

describe("sealMail", () => {
  it("opens to the same mail", () => {
    expect(openMail(key, sealMail(key, mail))).toEqual(mail);
  });

  it("leaves no address, subject, or link readable", () => {
    const sealed = sealMail(key, mail);
    const decoded = Buffer.from(sealed, "base64").toString("latin1");
    for (const secret of ["rowan", "meritory", "Reset", "abc123"]) {
      expect(sealed).not.toContain(secret);
      expect(decoded).not.toContain(secret);
    }
  });

  it("uses a fresh IV each time", () => {
    expect(sealMail(key, mail)).not.toBe(sealMail(key, mail));
  });

  it("keeps only the mail's own fields", () => {
    const extra = { ...mail, bcc: "someone@meritory.test" };
    expect(openMail(key, sealMail(key, extra))).toEqual(mail);
  });
});

describe("openMail", () => {
  it("refuses another key, a changed byte, and junk", () => {
    const sealed = sealMail(key, mail);
    const bytes = Buffer.from(sealed, "base64");
    const last = bytes.length - 1;
    bytes[last] = (bytes[last] ?? 0) ^ 1;
    for (const [withKey, value] of [
      [randomBytes(32), sealed],
      [key, bytes.toString("base64")],
      [key, "bm90IGEgbWFpbA=="],
      [key, ""],
      [key, 42],
      [key, undefined],
    ] as const) {
      expect(() => openMail(withKey, value)).toThrow(UnreadableMailError);
    }
  });

  it("refuses a sealed value that isn't a mail", () => {
    const sealed = sealMail(key, { to: 1 } as never);
    expect(() => openMail(key, sealed)).toThrow(UnreadableMailError);
  });
});
