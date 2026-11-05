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

  it("only caps at acceptance for a prompt never reviewed", () => {
    const claimed = new Date("2020-01-01T00:00:00Z");
    expect(effectiveReviewTime(claimed, null, accepted)).toEqual(claimed);
  });
});
