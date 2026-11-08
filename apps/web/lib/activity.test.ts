import { describe, expect, it } from "vitest";
import { activeText, daysAgo, listNames, signedInText } from "./activity";

const now = new Date(2026, 10, 7, 9, 30);
const at = (day: number, hour = 12, year = 2026, month = 10) =>
  new Date(year, month, day, hour);

describe("daysAgo", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    expect(daysAgo(at(7, 1), now)).toBe("today");
    expect(daysAgo(at(6, 23), now)).toBe("yesterday");
    expect(daysAgo(at(3), now)).toBe("4 days ago");
  });

  it("never says a time in the future is ago", () => {
    expect(daysAgo(at(8), now)).toBe("today");
  });
});

describe("activeText", () => {
  it("says this device is active now", () => {
    expect(activeText(at(1), true, now)).toBe("Active now");
  });

  it("gives other devices day precision", () => {
    expect(activeText(at(7, 8), false, now)).toBe("Active today");
    expect(activeText(at(3), false, now)).toBe("Active 4 days ago");
  });
});

describe("signedInText", () => {
  it("leaves out this year", () => {
    expect(signedInText(at(3), now)).toBe("signed in Nov 3");
  });

  it("adds the year for an older sign-in", () => {
    expect(signedInText(at(28, 12, 2025, 9), now)).toBe(
      "signed in Oct 28, 2025",
    );
  });
});

describe("listNames", () => {
  it.each([
    [["Firefox on macOS"], "Firefox on macOS"],
    [["A", "B"], "A and B"],
    [["A", "B", "C"], "A, B, and C"],
  ])("joins %j", (names, text) => {
    expect(listNames(names)).toBe(text);
  });
});
