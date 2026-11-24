import { describe, expect, it } from "vitest";
import {
  dailySavedLine,
  dayStartHelp,
  digitsOnly,
  hourLabel,
  newCardsHelp,
  recallTargetHelp,
  trackLimitsLine,
  wholeNumber,
} from "./settings.ts";

describe("settings wording", () => {
  it("names every hour on a 12-hour clock", () => {
    expect(hourLabel(0)).toBe("Midnight");
    expect(hourLabel(4)).toBe("4:00 a.m.");
    expect(hourLabel(12)).toBe("Noon");
    expect(hourLabel(23)).toBe("11:00 p.m.");
    expect(dayStartHelp(4)).toBe(
      "Suggested: 4:00 a.m. Study before then counts toward the day before.",
    );
    expect(dayStartHelp(0)).toBe(
      "Suggested: Midnight. Study before then counts toward the day before.",
    );
  });

  it("says what a new card rate settles into", () => {
    expect(newCardsHelp(20, 10)).toBe(
      "Suggested: 10. At 20, expect around 200 reviews a day once you've settled in.",
    );
    expect(newCardsHelp(0, 10)).toContain("no new cards come in");
    expect(dailySavedLine(20)).toBe(
      "Saved. You'll get up to 20 new cards a day, starting today.",
    );
  });

  it("notes the cost of a target outside 80% to 95%", () => {
    expect(recallTargetHelp(90, 90)).toContain("Higher means");
    expect(recallTargetHelp(75, 90)).toBe(
      "Suggested: 90%. At 75%, you'll forget more between reviews, and relearning them adds work.",
    );
    expect(recallTargetHelp(97, 90)).toContain("reviews climb fast");
  });

  it("sums up track limits", () => {
    expect(trackLimitsLine({}, 20)).toBe(
      "None set. Every track draws from the 20 above.",
    );
    expect(trackLimitsLine({ dsa: 5, design: 0 }, 20)).toBe(
      "Set for 2 tracks. Each comes out of the 20 a day.",
    );
  });

  it("keeps fields to whole numbers", () => {
    expect(digitsOnly("1e2.5%")).toBe("125");
    expect(digitsOnly("12345")).toBe("123");
    expect(wholeNumber("")).toBeNull();
    expect(wholeNumber("045")).toBe(45);
  });
});
