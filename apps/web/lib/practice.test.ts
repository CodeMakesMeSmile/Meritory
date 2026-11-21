import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clock,
  EMPTY_DRAFT,
  type Exercise,
  exercisePath,
  practiceOrder,
  type Rubric,
  readDraft,
  scoreResult,
  wordCount,
  writeDraft,
} from "./practice";

const store = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
vi.stubGlobal("window", { localStorage });

const levels = ["One", "Two", "Three", "Four"];

const rubric = {
  id: "design-review",
  title: "Design review",
  criteria: [
    { id: "requirements", name: "Requirements", scoredBy: "self", levels },
    { id: "trade-offs", name: "Trade-offs", scoredBy: "self", levels },
    { id: "tests", name: "Tests", scoredBy: "tests", levels },
  ],
  pass: { total: 6, lowest: 2 },
  hash: "h",
  version: 1,
} as Rubric;

describe("scoreResult", () => {
  it("passes at the pass total with nothing under the lowest level", () => {
    const result = scoreResult(rubric, [], {
      requirements: 3,
      "trade-offs": 3,
    });
    expect(result).toMatchObject({ total: 6, max: 8, passed: true, short: [] });
  });

  it("doesn't pass under the total", () => {
    const result = scoreResult(rubric, [], {
      requirements: 3,
      "trade-offs": 2,
    });
    expect(result.passed).toBe(false);
    expect(result.totalShort).toBe(true);
    expect(result.short).toEqual([]);
  });

  it("names a criterion under the lowest level even when the total passes", () => {
    const lenient = { ...rubric, pass: { total: 5, lowest: 2 } };
    const result = scoreResult(lenient, [], {
      requirements: 4,
      "trade-offs": 1,
    });
    expect(result.passed).toBe(false);
    expect(result.totalShort).toBe(false);
    expect(result.short).toEqual([
      { id: "trade-offs", name: "Trade-offs", needs: 2 },
    ]);
  });

  it("holds a required criterion to level 3", () => {
    const result = scoreResult(rubric, ["requirements"], {
      requirements: 2,
      "trade-offs": 4,
    });
    expect(result.passed).toBe(false);
    expect(result.short).toEqual([
      { id: "requirements", name: "Requirements", needs: 3 },
    ]);
  });

  it("counts a missing score as 0 and leaves out test-scored criteria", () => {
    const result = scoreResult(rubric, [], { requirements: 4 });
    expect(result.total).toBe(4);
    expect(result.max).toBe(8);
    expect(result.short.map((c) => c.id)).toEqual(["trade-offs"]);
  });
});

describe("drafts", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a draft per exercise version", () => {
    const draft = {
      answer: "Queues",
      scores: { a: 3 },
      seconds: 90,
      scored: false,
    };
    writeDraft("system-design", "unified-api", 1, draft);
    expect(readDraft("system-design", "unified-api", 1)).toEqual(draft);
    expect(readDraft("system-design", "unified-api", 2)).toEqual(EMPTY_DRAFT);
  });

  it("drops scores and fields that don't fit", () => {
    localStorage.setItem(
      "meritory.practice.t.e.v1",
      JSON.stringify({
        answer: 5,
        scores: { a: 9, b: 2, c: "3", d: 1.5 },
        seconds: -4,
        scored: "yes",
      }),
    );
    expect(readDraft("t", "e", 1)).toEqual({
      answer: "",
      scores: { b: 2 },
      seconds: 0,
      scored: false,
    });
  });

  it("ignores a draft that isn't JSON", () => {
    localStorage.setItem("meritory.practice.t.e.v1", "{nope");
    expect(readDraft("t", "e", 1)).toEqual(EMPTY_DRAFT);
  });

  it("clears a draft", () => {
    writeDraft("t", "e", 1, { ...EMPTY_DRAFT, answer: "x" });
    writeDraft("t", "e", 1, null);
    expect(localStorage.getItem("meritory.practice.t.e.v1")).toBeNull();
  });
});

describe("practiceOrder", () => {
  const exercise = (id: string, sibling: string, difficulty: string) =>
    ({ id, sibling, difficulty, title: id }) as unknown as Exercise;

  it("keeps siblings together, easier pairs first", () => {
    const order = practiceOrder([
      exercise("b-hard", "a-hard", "hard"),
      exercise("a-hard", "b-hard", "hard"),
      exercise("z-easy", "y-medium", "easy"),
      exercise("y-medium", "z-easy", "medium"),
    ]);
    expect(order.map((e) => e.id)).toEqual([
      "z-easy",
      "y-medium",
      "a-hard",
      "b-hard",
    ]);
  });
});

describe("helpers", () => {
  it("encodes each part of the exercise path", () => {
    expect(exercisePath("system-design", "case-studies", "a/b")).toBe(
      "/tracks/system-design/chapters/case-studies/exercises/a%2Fb",
    );
  });

  it("reads the timer in minutes, then hours", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(605)).toBe("10:05");
    expect(clock(3729)).toBe("1:02:09");
  });

  it("counts words", () => {
    expect(wordCount("  ")).toBe(0);
    expect(wordCount("Queue the sync\njobs")).toBe(4);
  });
});
