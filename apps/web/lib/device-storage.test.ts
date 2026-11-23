import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDrafts } from "./device-storage.ts";

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
