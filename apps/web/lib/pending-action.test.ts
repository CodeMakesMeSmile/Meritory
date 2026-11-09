import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  savePendingAction,
  savePendingMethod,
  takePendingAction,
  takePendingMethod,
} from "./pending-action.ts";

const KEY = "meritory.pending-session-action";
const ID = "0b6f3c1e-8a3d-4f7a-9c2e-5d1b7e9f0a12";

describe("pending sign-out", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("keeps a waiting link apart from a waiting sign-out", () => {
    savePendingAction({ kind: "others" });
    savePendingMethod({ kind: "unlink", provider: "github" });
    expect(takePendingMethod()).toEqual({ kind: "unlink", provider: "github" });
    expect(takePendingMethod()).toBeNull();
    expect(takePendingAction()).toEqual({ kind: "others" });
  });

  it.each([
    { kind: "link", provider: "gitlab" },
    { kind: "delete", provider: "github" },
    { kind: "unlink" },
  ])("ignores a malformed waiting link %j", (saved) => {
    store.set("meritory.pending-method-action", JSON.stringify(saved));
    expect(takePendingMethod()).toBeNull();
  });

  it("comes back once, then is gone", () => {
    savePendingAction({ kind: "one", id: ID });
    expect(takePendingAction()).toEqual({ kind: "one", id: ID });
    expect(takePendingAction()).toBeNull();
    savePendingAction({ kind: "others" });
    expect(takePendingAction()).toEqual({ kind: "others" });
  });

  it.each([
    "not json",
    "null",
    '{"kind":"one","id":"../../admin"}',
    '{"kind":"one","id":42}',
    '{"kind":"everyone"}',
  ])("ignores a saved value of %s and clears it", (raw) => {
    store.set(KEY, raw);
    expect(takePendingAction()).toBeNull();
    expect(store.has(KEY)).toBe(false);
  });

  it("keeps only the fields it knows", () => {
    store.set(KEY, JSON.stringify({ kind: "others", id: ID, extra: true }));
    expect(takePendingAction()).toEqual({ kind: "others" });
  });

  it("carries on without storage", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("sessionStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    expect(() => savePendingAction({ kind: "others" })).not.toThrow();
    expect(takePendingAction()).toBeNull();
  });
});
