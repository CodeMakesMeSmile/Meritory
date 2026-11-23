import { describe, expect, it } from "vitest";
import { createAsks } from "./asks.ts";

describe("asks", () => {
  it("keeps an answer wanted until a cancel", () => {
    const asks = createAsks();
    const wanted = asks.ask();
    expect(wanted()).toBe(true);
    asks.cancel();
    expect(wanted()).toBe(false);
  });

  it("wants the answer to a question asked after the cancel", () => {
    const asks = createAsks();
    const first = asks.ask();
    asks.cancel();
    const second = asks.ask();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });

  // The check comes back after Cancel, and the action must not run
  it("drops a late answer", async () => {
    const asks = createAsks();
    let ran = false;
    let answer = () => {};
    const check = new Promise<void>((resolve) => {
      answer = resolve;
    });
    const submit = (async () => {
      const wanted = asks.ask();
      await check;
      if (wanted()) ran = true;
    })();
    asks.cancel();
    answer();
    await submit;
    expect(ran).toBe(false);
  });
});
