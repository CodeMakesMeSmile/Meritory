import { describe, expect, it } from "vitest";
import { isKnownTimeZone, nextRecallDayStart, recallDayStart } from "./day.ts";

const at = (iso: string) => new Date(iso);

describe("recallDayStart", () => {
  it("starts the day at 4 a.m. local time", () => {
    // 9 a.m. in Toronto, which is UTC-5 in November
    expect(
      recallDayStart(at("2026-11-19T14:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-11-19T09:00:00Z"));
  });

  it("counts the small hours toward the day before", () => {
    // 1 a.m. in Toronto
    expect(
      recallDayStart(at("2026-11-20T06:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-11-19T09:00:00Z"));
  });

  it("turns over exactly at 4 a.m.", () => {
    const four = at("2026-11-20T09:00:00Z");
    expect(recallDayStart(four, "America/Toronto")).toEqual(four);
    expect(
      recallDayStart(new Date(four.getTime() - 1), "America/Toronto"),
    ).toEqual(at("2026-11-19T09:00:00Z"));
  });

  it("follows the clock change in spring and fall", () => {
    // Clocks go forward on 2026-03-08 and back on 2026-11-01 in Toronto
    expect(
      recallDayStart(at("2026-03-08T12:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-03-08T08:00:00Z"));
    expect(
      recallDayStart(at("2026-11-01T12:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-11-01T09:00:00Z"));
  });

  it("works for zones ahead of UTC and with half hours", () => {
    expect(recallDayStart(at("2026-11-19T02:00:00Z"), "Asia/Kolkata")).toEqual(
      at("2026-11-18T22:30:00Z"),
    );
    expect(recallDayStart(at("2026-11-19T12:00:00Z"), "UTC")).toEqual(
      at("2026-11-19T04:00:00Z"),
    );
  });
});

describe("nextRecallDayStart", () => {
  it("finds the next 4 a.m. local time", () => {
    expect(
      nextRecallDayStart(at("2026-11-19T09:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-11-20T09:00:00Z"));
  });

  it("is 23 or 25 hours on across a clock change", () => {
    // The day of 2026-03-07 is followed by the short day of 2026-03-08
    expect(
      nextRecallDayStart(at("2026-03-07T09:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-03-08T08:00:00Z"));
    expect(
      nextRecallDayStart(at("2026-10-31T08:00:00Z"), "America/Toronto"),
    ).toEqual(at("2026-11-01T09:00:00Z"));
  });
});

describe("isKnownTimeZone", () => {
  it("accepts IANA names, old and new, and refuses anything else", () => {
    for (const name of [
      "America/Toronto",
      "UTC",
      "Asia/Kolkata",
      "Asia/Calcutta",
    ]) {
      expect(isKnownTimeZone(name), name).toBe(true);
    }
    expect(isKnownTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isKnownTimeZone("'; drop table users; --")).toBe(false);
  });
});
