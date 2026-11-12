import { describe, expect, it } from "vitest";
import {
  addDays,
  currentFacts,
  dueOn,
  isCurrent,
  recheckReport,
  todayUtc,
} from "./recheck.ts";

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

describe("addDays", () => {
  it.each([
    ["2026-11-12", 30, "2026-12-12"],
    ["2026-12-15", 30, "2027-01-14"],
    ["2028-02-01", 30, "2028-03-02"],
    ["2027-02-01", 30, "2027-03-03"],
    ["2026-11-12", 0, "2026-11-12"],
    ["2026-03-01", -1, "2026-02-28"],
    ["0050-12-31", 1, "0051-01-01"],
  ])("puts %s plus %i days on %s", (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });

  it("refuses a date it can't read", () => {
    expect(() => addDays("12/11/2026", 1)).toThrow(RangeError);
  });
});

describe("recheckReport", () => {
  const today = "2026-11-12";
  // Each is due 6 months after it was checked
  const facts = [
    { id: "due-in-31-days", checkedOn: "2026-06-13" },
    { id: "due-in-30-days", checkedOn: "2026-06-12" },
    { id: "due-tomorrow", checkedOn: "2026-05-13" },
    { id: "due-today", checkedOn: "2026-05-12" },
    { id: "long-overdue", checkedOn: "2025-01-10" },
    { id: "fresh", checkedOn: "2026-11-02" },
  ];

  const ids = (items: { fact: { id: string } }[]) =>
    items.map((item) => item.fact.id);

  it("lists hidden facts as overdue, earliest first", () => {
    const report = recheckReport(facts, today);
    expect(ids(report.overdue)).toEqual(["long-overdue", "due-today"]);
    expect(report.overdue[0]?.dueOn).toBe("2025-07-10");
  });

  it("lists facts due within 30 days, including the 30th", () => {
    const report = recheckReport(facts, today);
    expect(ids(report.dueSoon)).toEqual(["due-tomorrow", "due-in-30-days"]);
    expect(report.dueSoon[1]?.dueOn).toBe("2026-12-12");
  });

  it("leaves out facts due later", () => {
    const report = recheckReport(facts, today);
    const listed = [...ids(report.overdue), ...ids(report.dueSoon)];
    expect(listed).not.toContain("due-in-31-days");
    expect(listed).not.toContain("fresh");
  });

  it("agrees with isCurrent on every fact", () => {
    const report = recheckReport(facts, today);
    for (const { fact } of report.overdue) {
      expect(isCurrent(fact, today)).toBe(false);
    }
    for (const { fact } of report.dueSoon) {
      expect(isCurrent(fact, today)).toBe(true);
    }
  });

  it("has nothing to report with no facts", () => {
    expect(recheckReport([], today)).toEqual({ overdue: [], dueSoon: [] });
  });
});

describe("todayUtc", () => {
  it("uses the UTC date, not the local one", () => {
    // 9 pm in Toronto on 11 November is already 12 November in UTC
    expect(todayUtc(new Date("2026-11-12T02:00:00Z"))).toBe("2026-11-12");
  });
});
