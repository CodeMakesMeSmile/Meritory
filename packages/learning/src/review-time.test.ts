import { describe, expect, it } from "vitest";
import { effectiveReviewTime } from "./review-time.ts";

const previous = new Date("2026-11-01T09:00:00Z");
const accepted = new Date("2026-11-03T09:00:00Z");

describe("effectiveReviewTime", () => {
  it("keeps a claimed time that falls inside the window", () => {
    const claimed = new Date("2026-11-02T20:15:00Z");
    expect(effectiveReviewTime(claimed, previous, accepted)).toEqual(claimed);
  });

  it("moves a claim from before the previous review up to that review", () => {
    const claimed = new Date("2026-10-30T00:00:00Z");
    expect(effectiveReviewTime(claimed, previous, accepted)).toEqual(previous);
  });

  it("moves a claim from the future back to the acceptance time", () => {
    const claimed = new Date("2027-01-01T00:00:00Z");
    expect(effectiveReviewTime(claimed, previous, accepted)).toEqual(accepted);
  });

  it("moves a first review claimed before the card existed up to when it was added", () => {
    const added = new Date("2026-11-02T08:00:00Z");
    for (const claimed of [new Date("2000-01-01T00:00:00Z"), new Date(0)]) {
      expect(effectiveReviewTime(claimed, added, accepted)).toEqual(added);
    }
  });
});
