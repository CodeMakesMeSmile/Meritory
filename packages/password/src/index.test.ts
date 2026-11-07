import { describe, expect, it } from "vitest";
import { checkPassword, countCharacters } from "./index.ts";

describe("countCharacters", () => {
  it("counts an emoji as one character", () => {
    expect("🙂".length).toBe(2);
    expect(countCharacters("🙂🙂🙂")).toBe(3);
  });
});

describe("checkPassword", () => {
  it("asks for 16 characters and says how many there are", () => {
    expect(checkPassword("short one here")).toMatchObject({
      problem: "too_short",
      message: "Use at least 16 characters. You have 14.",
    });
  });

  it("never rates a short password above fair", () => {
    expect(checkPassword("q8#Lm2!vZ0p$Rt").strength).toBe("fair");
    expect(checkPassword("anna likes tea", { name: "Anna" }).strength).toBe(
      "weak",
    );
  });

  it("does not let emoji pairs pass the minimum", () => {
    expect(checkPassword("🙂".repeat(8)).problem).toBe("too_short");
  });

  it("caps the length at 128", () => {
    expect(checkPassword("x".repeat(129))).toMatchObject({
      problem: "too_long",
      message: "Use 128 characters or fewer.",
    });
  });

  it("rejects passwords that are long but easy to guess", () => {
    expect(checkPassword("aaaaaaaaaaaaaaaa")).toMatchObject({
      strength: "weak",
      problem: "weak",
    });
    expect(checkPassword("1234567890123456").problem).toBe("weak");
  });

  it("rejects the name, the email, and the service name", () => {
    const details = { name: "Anna Chester", email: "anna.c@example.com" };
    for (const password of [
      "chester likes long walks",
      "anna.c rides the tram home",
      "my meritory study passphrase",
    ]) {
      expect(checkPassword(password, details).problem).toBe("personal");
    }
  });

  it("accepts a few unrelated words, with no character rules", () => {
    const result = checkPassword("violet harbor tractor sandwich");
    expect(result.problem).toBeNull();
    expect(["good", "strong"]).toContain(result.strength);
  });
});
