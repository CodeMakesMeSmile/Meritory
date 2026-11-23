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

  it("never rates a password that's too long as strong", () => {
    const long = "violet harbor tractor sandwich ".repeat(5);
    expect(checkPassword(long).strength).toBe("weak");
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

  it("accepts a short name that only sits inside a longer word", () => {
    for (const [name, password] of [
      ["Ian Moss", "grand piano under violet stars"],
      ["Tom", "the bottom shelf holds teacups"],
      ["Li", "violet harbor sunlight sandwich"],
    ] as const) {
      expect(checkPassword(password, { name }).problem).toBeNull();
    }
  });

  it("rejects a short name used as a word of its own", () => {
    for (const [name, password] of [
      ["Ian Moss", "ian plays the grand piano"],
      ["Tom", "teacups for tom2024 and friends"],
      ["Anna", "Tram-rides-with-ANNA-daily"],
    ] as const) {
      expect(checkPassword(password, { name }).problem).toBe("personal");
    }
  });

  it("still finds a name of five letters or more inside a word", () => {
    const check = checkPassword("superchesterfield sofa tram", {
      name: "Anna Chester",
    });
    expect(check.problem).toBe("personal");
  });

  it("accepts a few unrelated words, with no character rules", () => {
    const result = checkPassword("violet harbor tractor sandwich");
    expect(result.problem).toBeNull();
    expect(["good", "strong"]).toContain(result.strength);
  });
});
