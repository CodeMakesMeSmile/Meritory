import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { Mail } from "./mailer.ts";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
// Binds each sealed mail to this one use of the key
const CONTEXT = Buffer.from("meritory mail job v1");

/** A queued mail that can't be opened, so no later try will send it */
export class UnreadableMailError extends Error {
  constructor() {
    super("The queued mail can't be opened with this key.");
    this.name = "UnreadableMailError";
  }
}

/** MAIL_JOB_KEY holds 32 random bytes in base64 */
export function readMailKey(value: string | undefined): Buffer {
  const key = Buffer.from(value ?? "", "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      "MAIL_JOB_KEY must be 32 bytes in base64. Generate one with: openssl rand -base64 32",
    );
  }
  return key;
}

/** AES-256-GCM with a fresh IV, packed as base64 of IV, tag, and ciphertext */
export function sealMail(key: Buffer, mail: Mail): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  cipher.setAAD(CONTEXT);
  const { to, subject, text } = mail;
  const body = Buffer.concat([
    cipher.update(JSON.stringify({ to, subject, text }), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

export function openMail(key: Buffer, sealed: unknown): Mail {
  if (typeof sealed !== "string") throw new UnreadableMailError();
  const bytes = Buffer.from(sealed, "base64");
  if (bytes.length <= IV_BYTES + TAG_BYTES) throw new UnreadableMailError();
  let found: unknown;
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      bytes.subarray(0, IV_BYTES),
      { authTagLength: TAG_BYTES },
    );
    decipher.setAAD(CONTEXT);
    decipher.setAuthTag(bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const text = Buffer.concat([
      decipher.update(bytes.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]).toString("utf8");
    found = JSON.parse(text);
  } catch {
    throw new UnreadableMailError();
  }
  const mail = found as Partial<Mail> | null;
  if (
    typeof mail?.to !== "string" ||
    typeof mail.subject !== "string" ||
    typeof mail.text !== "string"
  ) {
    throw new UnreadableMailError();
  }
  return { to: mail.to, subject: mail.subject, text: mail.text };
}
