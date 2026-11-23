import type { InterviewDateResponse } from "@meritory/contracts";
import { describe, expect, it } from "vitest";
import {
  dayAndYear,
  dayName,
  interviewIsAhead,
  interviewStatusLine,
} from "./interview.ts";

const state = (
  more: Partial<InterviewDateResponse>,
): InterviewDateResponse => ({
  date: null,
  startsOn: null,
  status: "none",
  target: 0.9,
  ...more,
});

describe("interview date wording", () => {
  it("names a day without shifting it by time zone", () => {
    expect(dayName("2026-12-14")).toBe("December 14");
    expect(dayAndYear("2027-01-01")).toBe("January 1, 2027");
  });

  it("says nothing without a date", () => {
    expect(interviewStatusLine(state({}))).toBeNull();
    expect(interviewIsAhead(state({}))).toBe(false);
    expect(interviewIsAhead(null)).toBe(false);
  });

  it("says when the higher target is on", () => {
    const on = state({
      date: "2026-12-14",
      startsOn: "2026-11-16",
      status: "on",
      target: 0.95,
    });
    expect(interviewStatusLine(on)).toBe(
      "On now. Until December 14, cards come back a bit sooner, aiming for 95% recall instead of 90%.",
    );
    expect(interviewIsAhead(on)).toBe(true);
  });

  it("says when it starts for a date further off", () => {
    const later = state({
      date: "2027-01-29",
      startsOn: "2027-01-01",
      status: "later",
    });
    expect(interviewStatusLine(later)).toBe(
      "Saved. From January 1, cards come back a bit sooner, aiming for 95% recall instead of 90%.",
    );
    expect(interviewIsAhead(later)).toBe(true);
  });

  it("says a passed date is over", () => {
    const passed = state({ date: "2026-12-14", status: "passed" });
    expect(interviewStatusLine(passed)).toBe(
      "December 14 has passed, so recall is back to its usual 90%. Add a new date any time.",
    );
    expect(interviewIsAhead(passed)).toBe(false);
  });
});
