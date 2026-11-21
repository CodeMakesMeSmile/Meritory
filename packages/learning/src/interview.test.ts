import { describe, expect, it } from "vitest";
import {
  addDays,
  INTERVIEW_RECALL_TARGET,
  interviewStatus,
  isCalendarDate,
  recallDate,
  recallTargetFor,
} from "./interview.ts";
import { DEFAULT_RECALL_TARGET } from "./scheduler.ts";

describe("recallTargetFor", () => {
  const today = "2026-11-21";

  it("raises the target 28 days before the interview", () => {
    expect(recallTargetFor(addDays(today, 28), today)).toBe(
      INTERVIEW_RECALL_TARGET,
    );
  });

  it("keeps the usual target 29 days before", () => {
    expect(recallTargetFor(addDays(today, 29), today)).toBe(
      DEFAULT_RECALL_TARGET,
    );
  });

  it("keeps the higher target on the interview day", () => {
    expect(recallTargetFor(today, today)).toBe(INTERVIEW_RECALL_TARGET);
  });

  it("goes back to the usual target the day after", () => {
    expect(recallTargetFor(addDays(today, -1), today)).toBe(
      DEFAULT_RECALL_TARGET,
    );
  });

  it("uses the usual target with no date", () => {
    expect(recallTargetFor(null, today)).toBe(DEFAULT_RECALL_TARGET);
  });
});

describe("interviewStatus", () => {
  it("names each stage", () => {
    expect(interviewStatus(null, "2026-11-21")).toBe("none");
    expect(interviewStatus("2027-01-29", "2026-11-21")).toBe("later");
    expect(interviewStatus("2026-12-14", "2026-11-21")).toBe("on");
    expect(interviewStatus("2026-11-20", "2026-11-21")).toBe("passed");
  });
});

describe("isCalendarDate", () => {
  it("accepts real dates only", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2027-02-29")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("2026-1-01")).toBe(false);
    expect(isCalendarDate("2026-11-21T00:00")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses months and years", () => {
    expect(addDays("2027-01-29", -28)).toBe("2027-01-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("recallDate", () => {
  it("counts the hours before 4 a.m. as the day before", () => {
    // 3 a.m. and 5 a.m. on November 21 in Toronto
    expect(
      recallDate(new Date("2026-11-21T08:00:00Z"), "America/Toronto"),
    ).toBe("2026-11-20");
    expect(
      recallDate(new Date("2026-11-21T10:00:00Z"), "America/Toronto"),
    ).toBe("2026-11-21");
  });
});
