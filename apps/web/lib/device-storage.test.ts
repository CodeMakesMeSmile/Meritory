import { afterEach, describe, expect, it, vi } from "vitest";
import {
  claimDrafts,
  clearDrafts,
  readStoppedAt,
  writeStoppedAt,
} from "./device-storage.ts";

function memoryStorage(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  return {
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    keys: () => [...store.keys()],
  };
}

describe("where recall stopped", () => {
  afterEach(() => vi.unstubAllGlobals());

  const evening = new Date(2026, 10, 22, 21, 0);

  it("shows the same recall day, up to 4 a.m.", () => {
    vi.stubGlobal("window", { sessionStorage: memoryStorage({}) });
    writeStoppedAt({ done: 4, total: 10 }, evening);
    expect(readStoppedAt(new Date(2026, 10, 23, 3, 59))).toEqual({
      done: 4,
      total: 10,
    });
  });

  it("is gone the next recall day", () => {
    vi.stubGlobal("window", { sessionStorage: memoryStorage({}) });
    writeStoppedAt({ done: 4, total: 10 }, evening);
    expect(readStoppedAt(new Date(2026, 10, 23, 4, 0))).toBeNull();
  });

  it("is cleared with the drafts", () => {
    const session = memoryStorage({});
    vi.stubGlobal("window", {
      sessionStorage: session,
      localStorage: memoryStorage({}),
    });
    writeStoppedAt({ done: 4, total: 10 }, evening);
    clearDrafts();
    expect(session.keys()).toEqual([]);
  });
});

describe("claimDrafts", () => {
  afterEach(() => vi.unstubAllGlobals());

  const drafts = (owner?: string) =>
    memoryStorage({
      "meritory.practice.dsa.two-sum.v1": "{}",
      ...(owner ? { "meritory.owner": owner } : {}),
    });

  it("keeps the same account's drafts", () => {
    const storage = drafts("anna");
    vi.stubGlobal("window", { localStorage: storage });
    claimDrafts("anna");
    expect(storage.keys()).toContain("meritory.practice.dsa.two-sum.v1");
  });

  it("forgets drafts another account left behind", () => {
    const storage = drafts("anna");
    vi.stubGlobal("window", { localStorage: storage });
    claimDrafts("ben");
    expect(storage.keys()).toEqual(["meritory.owner"]);
    expect(storage.getItem("meritory.owner")).toBe("ben");
  });

  it("keeps drafts from before owners were recorded", () => {
    const storage = drafts();
    vi.stubGlobal("window", { localStorage: storage });
    claimDrafts("anna");
    expect(storage.keys()).toContain("meritory.practice.dsa.two-sum.v1");
    expect(storage.getItem("meritory.owner")).toBe("anna");
  });
});

describe("clearDrafts", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("removes practice, code, and rehearsal drafts, and nothing else", () => {
    const storage = memoryStorage({
      "meritory.practice.dsa.two-sum.v1": "{}",
      "meritory.code.dsa.two-sum.python": "class Solution: ...",
      "meritory.code.language": "python",
      "meritory.rehearsal.system-design.unified-api.v1": "{}",
      "meritory.shortcuts": "off",
      "other.site": "kept",
    });
    vi.stubGlobal("window", { localStorage: storage });
    clearDrafts();
    expect(storage.keys()).toEqual(["meritory.shortcuts", "other.site"]);
  });

  it("does nothing when storage is blocked", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    expect(() => clearDrafts()).not.toThrow();
  });
});
