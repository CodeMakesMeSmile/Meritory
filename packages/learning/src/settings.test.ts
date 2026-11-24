import { describe, expect, it } from "vitest";
import { recallDayStart } from "./day.ts";
import {
  checkSettings,
  type LearnerSettings,
  SUGGESTED_SETTINGS,
  settledReviewsPerDay,
} from "./settings.ts";

const with_ = (change: Partial<LearnerSettings>): LearnerSettings => ({
  ...SUGGESTED_SETTINGS,
  ...change,
});

const fields = (settings: LearnerSettings) =>
  checkSettings(settings).map((problem) => problem.field);

describe("checkSettings", () => {
  it("accepts the suggested settings", () => {
    expect(checkSettings(SUGGESTED_SETTINGS)).toEqual([]);
  });

  it("accepts the edges of every range", () => {
    expect(
      checkSettings(
        with_({
          newCardsPerDay: 50,
          trackNewLimits: { dsa: 0, design: 50 },
          reviewsPerDay: 500,
          recallTarget: 70,
          interviewTarget: 97,
          interviewWeeks: 8,
          dayStartsAt: 0,
          rehearsalMinutes: {
            designReview: 15,
            classDesign: 90,
            storyAnswer: 1,
          },
          codeLanguage: "python",
        }),
      ),
    ).toEqual([]);
  });

  it("names each field that is out of range", () => {
    expect(
      fields(
        with_({
          newCardsPerDay: 51,
          trackNewLimits: { dsa: -1 },
          reviewsPerDay: 49,
          recallTarget: 98,
          interviewWeeks: 0,
          dayStartsAt: 24,
          rehearsalMinutes: {
            designReview: 14,
            classDesign: 91,
            storyAnswer: 11,
          },
        }),
      ),
    ).toEqual([
      "newCardsPerDay",
      "trackNewLimits.dsa",
      "reviewsPerDay",
      "recallTarget",
      "interviewWeeks",
      "dayStartsAt",
      "rehearsalMinutes.designReview",
      "rehearsalMinutes.classDesign",
      "rehearsalMinutes.storyAnswer",
    ]);
  });

  it("refuses fractions and a target before an interview below the everyday one", () => {
    expect(fields(with_({ recallTarget: 90.5 }))).toContain("recallTarget");
    expect(fields(with_({ recallTarget: 92, interviewTarget: 91 }))).toEqual([
      "interviewTarget",
    ]);
  });

  it("refuses an unknown language", () => {
    expect(
      fields(
        with_({ codeLanguage: "ruby" as LearnerSettings["codeLanguage"] }),
      ),
    ).toEqual(["codeLanguage"]);
  });

  it("keeps the review load estimate at Anki's ratio", () => {
    expect(settledReviewsPerDay(20)).toBe(200);
  });
});

describe("recallDayStart", () => {
  it("starts the day at the learner's hour", () => {
    const now = new Date("2026-11-18T06:30:00Z");
    expect(recallDayStart(now, "UTC", 7).toISOString()).toBe(
      "2026-11-17T07:00:00.000Z",
    );
    expect(recallDayStart(now, "UTC", 0).toISOString()).toBe(
      "2026-11-18T00:00:00.000Z",
    );
  });
});
