import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayOfMonth,
  isBefore,
  localToday,
  monthIsPast,
  monthLabel,
  monthOf,
  monthRows,
} from "./calendar";

describe("phone calendar", () => {
  it("lays November 2026 out from Sunday", () => {
    const rows = monthRows({ year: 2026, month: 11 });
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(rows[4]).toEqual([
      "2026-11-29",
      "2026-11-30",
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("pads the start of a month that begins midweek", () => {
    const [first] = monthRows({ year: 2026, month: 12 });
    expect(first).toEqual([
      null,
      null,
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
    ]);
  });

  it("gives February its leap day", () => {
    const days = monthRows({ year: 2028, month: 2 }).flat().filter(Boolean);
    expect(days).toHaveLength(29);
  });

  it("moves across a year end both ways", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
    expect(addMonths({ year: 2027, month: 1 }, -1)).toEqual({
      year: 2026,
      month: 12,
    });
  });

  it("names a month and reads one from a date", () => {
    expect(monthLabel({ year: 2026, month: 11 })).toBe("November 2026");
    expect(monthOf("2027-01-29")).toEqual({ year: 2027, month: 1 });
    expect(dayOfMonth("2026-11-30")).toBe(30);
  });

  it("knows past days and past months", () => {
    expect(isBefore("2026-11-17", "2026-11-18")).toBe(true);
    expect(isBefore("2026-11-18", "2026-11-18")).toBe(false);
    expect(monthIsPast({ year: 2026, month: 10 }, "2026-11-18")).toBe(true);
    expect(monthIsPast({ year: 2026, month: 11 }, "2026-11-18")).toBe(false);
  });

  it("reads today from the phone's own clock", () => {
    expect(localToday(new Date(2026, 10, 3, 23, 30))).toBe("2026-11-03");
  });
});
