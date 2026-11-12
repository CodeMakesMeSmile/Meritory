import { describe, expect, it } from "vitest";
import { currentFacts, dueOn, isCurrent, todayUtc } from "./recheck.ts";

describe("dueOn", () => {
  it.each([
    ["2026-11-02", "2027-05-02"],
    ["2026-05-02", "2026-11-02"],
    ["2026-07-01", "2027-01-01"],
    ["2026-12-31", "2027-06-30"],
    ["2026-08-31", "2027-02-28"],
    ["2027-08-31", "2028-02-29"],
    ["2026-08-29", "2027-02-28"],
    ["2027-08-29", "2028-02-29"],
    ["2028-02-29", "2028-08-29"],
    ["2026-03-31", "2026-09-30"],
    ["2026-01-31", "2026-07-31"],
  ])("puts %s due on %s", (checkedOn, due) => {
    expect(dueOn(checkedOn)).toBe(due);
  });

  it("follows the leap rule for century years", () => {
    expect(dueOn("2099-08-31")).toBe("2100-02-28");
    expect(dueOn("2399-08-31")).toBe("2400-02-29");
  });

  it("keeps years below 100 as written", () => {
    expect(dueOn("0050-01-15")).toBe("0050-07-15");
  });

  it.each(["", "2026-1-2", "2026-11-02T00:00:00Z", "not a date"])(
    "refuses %j",
    (checkedOn) => {
      expect(() => dueOn(checkedOn)).toThrow(RangeError);
    },
  );
});

describe("isCurrent", () => {
  const fact = { checkedOn: "2026-11-02" };

  it("shows a fact the day it was checked", () => {
    expect(isCurrent(fact, "2026-11-02")).toBe(true);
  });

  it("shows a fact on the day before it's due", () => {
    expect(isCurrent(fact, "2027-05-01")).toBe(true);
  });

  it("hides a fact from its due date on", () => {
    expect(isCurrent(fact, "2027-05-02")).toBe(false);
    expect(isCurrent(fact, "2028-01-01")).toBe(false);
  });
});

describe("currentFacts", () => {
  it("leaves out facts past their recheck date", () => {
    const facts = [
      { id: "fresh", checkedOn: "2026-11-02" },
      { id: "stale", checkedOn: "2026-05-01" },
      { id: "due-today", checkedOn: "2026-05-12" },
    ];
    expect(currentFacts(facts, "2026-11-12").map((fact) => fact.id)).toEqual([
      "fresh",
    ]);
  });
});

describe("todayUtc", () => {
  it("uses the UTC date, not the local one", () => {
    // 9 pm in Toronto on 11 November is already 12 November in UTC
    expect(todayUtc(new Date("2026-11-12T02:00:00Z"))).toBe("2026-11-12");
  });
});
