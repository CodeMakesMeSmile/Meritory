import { describe, expect, it } from "vitest";
import { newReviewState, scheduleReview } from "./scheduler.ts";

const start = new Date("2026-11-01T09:00:00Z");

describe("scheduleReview", () => {
  it("starts a new prompt due immediately", () => {
    const state = newReviewState(start);
    expect(state.phase).toBe("new");
    expect(state.due).toEqual(start);
    expect(state.reps).toBe(0);
  });

  it("pushes the next review further out for easier ratings", () => {
    const state = newReviewState(start);
    const again = scheduleReview(state, "again", start);
    const good = scheduleReview(state, "good", start);
    const easy = scheduleReview(state, "easy", start);
    expect(again.due.getTime()).toBeLessThan(good.due.getTime());
    expect(good.due.getTime()).toBeLessThan(easy.due.getTime());
    expect(easy.reps).toBe(1);
  });

  it("counts a lapse when a review-phase prompt is forgotten", () => {
    let state = scheduleReview(newReviewState(start), "easy", start);
    expect(state.phase).toBe("review");
    state = scheduleReview(state, "again", state.due);
    expect(state.phase).toBe("relearning");
    expect(state.lapses).toBe(1);
  });

  it("gives the same result every time for the same input", () => {
    const state = newReviewState(start);
    const first = scheduleReview(state, "good", start);
    const second = scheduleReview(state, "good", start);
    expect(first).toEqual(second);
  });
});
