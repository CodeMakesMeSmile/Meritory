import { describe, expect, it } from "vitest";
import { emailChangePath, readChangeLink } from "./email-change.ts";

const token = (payload: unknown) =>
  `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

const base = {
  email: "a@meritory.test",
  updateTo: "b@meritory.test",
  userId: "1",
};

describe("readChangeLink", () => {
  it("reads both steps of an email change", () => {
    expect(
      readChangeLink(
        token({ ...base, requestType: "change-email-confirmation" }),
      ),
    ).toEqual({
      from: "a@meritory.test",
      to: "b@meritory.test",
      userId: "1",
      finishes: false,
    });
    expect(
      readChangeLink(
        token({ ...base, requestType: "change-email-verification" }),
      )?.finishes,
    ).toBe(true);
  });

  it.each([
    ["a sign-up link", token({ email: "a@meritory.test" })],
    [
      "a missing user",
      token({ email: "a@meritory.test", updateTo: "b@meritory.test" }),
    ],
    ["a payload that isn't JSON", "e30.bm90IGpzb24.sig"],
    ["a null payload", token(null)],
    ["no payload", "abc"],
    ["nothing", ""],
  ])("ignores %s", (_name, value) => {
    expect(readChangeLink(value)).toBeNull();
  });
});

describe("emailChangePath", () => {
  it("lands on Account with the step", () => {
    expect(emailChangePath("failed")).toBe("/account?email=failed");
  });
});
