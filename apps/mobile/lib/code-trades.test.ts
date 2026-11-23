import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCodeTrades, freshLink } from "./code-trades.ts";

const WAIT = 60_000;

describe("createCodeTrades", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("has not started before a code arrives", () => {
    const trades = createCodeTrades(async () => true);
    expect(trades.started).toBe(false);
    trades.offer("real");
    expect(trades.started).toBe(true);
  });

  it("succeeds with a code that trades", async () => {
    const trade = vi.fn(async () => true);
    const trades = createCodeTrades(trade);
    trades.offer("real");
    await expect(trades.result(WAIT)).resolves.toBe(true);
    expect(trade).toHaveBeenCalledExactlyOnceWith("real");
  });

  it("tries the real code after a junk one fails", async () => {
    const trade = vi.fn(async (code: string) => code === "real");
    const trades = createCodeTrades(trade);
    trades.offer("junk");
    trades.offer("real");
    await expect(trades.result(WAIT)).resolves.toBe(true);
    expect(trade.mock.calls).toEqual([["junk"], ["real"]]);
  });

  it("keeps waiting after a failure for a code that arrives later", async () => {
    const trades = createCodeTrades(async (code) => code === "real");
    trades.offer("junk");
    const result = trades.result(WAIT);
    await vi.advanceTimersByTimeAsync(WAIT / 2);
    trades.offer("real");
    await expect(result).resolves.toBe(true);
  });

  it("gives up when no code has traded by the end of the wait", async () => {
    const trades = createCodeTrades(async () => false);
    trades.offer("junk");
    const result = trades.result(WAIT);
    await vi.advanceTimersByTimeAsync(WAIT);
    await expect(result).resolves.toBe(false);
  });

  it("counts a trade that throws as a failure", async () => {
    const trades = createCodeTrades(async (code) => {
      if (code === "junk") throw new Error("offline");
      return true;
    });
    trades.offer("junk");
    trades.offer("real");
    await expect(trades.result(WAIT)).resolves.toBe(true);
  });

  it("trades nothing more once a code has worked", async () => {
    const trade = vi.fn(async () => true);
    const trades = createCodeTrades(trade);
    trades.offer("first");
    trades.offer("second");
    await expect(trades.result(WAIT)).resolves.toBe(true);
    trades.offer("third");
    await expect(trades.result(WAIT)).resolves.toBe(true);
    expect(trade).toHaveBeenCalledExactlyOnceWith("first");
  });

  it("trades one code at a time", async () => {
    let release = (_: boolean) => {};
    const trade = vi.fn(
      (code: string) =>
        new Promise<boolean>((resolve) => {
          if (code === "slow") release = resolve;
          else resolve(true);
        }),
    );
    const trades = createCodeTrades(trade);
    trades.offer("slow");
    trades.offer("next");
    await vi.advanceTimersByTimeAsync(0);
    expect(trade).toHaveBeenCalledExactlyOnceWith("slow");
    release(true);
    await expect(trades.result(WAIT)).resolves.toBe(true);
    expect(trade).toHaveBeenCalledTimes(1);
  });

  it("tries a repeated code once", async () => {
    const trade = vi.fn(async () => false);
    const trades = createCodeTrades(trade);
    trades.offer("junk");
    trades.offer("junk");
    const result = trades.result(WAIT);
    await vi.advanceTimersByTimeAsync(WAIT);
    await expect(result).resolves.toBe(false);
    expect(trade).toHaveBeenCalledTimes(1);
  });

  it("stops trading at the limit", async () => {
    const trade = vi.fn(async () => false);
    const trades = createCodeTrades(trade, 2);
    trades.offer("a");
    trades.offer("b");
    trades.offer("c");
    const result = trades.result(WAIT);
    await vi.advanceTimersByTimeAsync(WAIT);
    await expect(result).resolves.toBe(false);
    expect(trade.mock.calls).toEqual([["a"], ["b"]]);
  });
});

describe("freshLink", () => {
  it.each([
    ["app://?code=new", null, "app://?code=new"],
    ["app://?code=new", "app://?code=old", "app://?code=new"],
    ["app://?code=old", "app://?code=old", null],
    [null, "app://?code=old", null],
    [null, null, null],
  ])("reads %j after %j as %j", (after, before, fresh) => {
    expect(freshLink(before, after)).toBe(fresh);
  });
});
