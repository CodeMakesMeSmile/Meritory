import type { AddressInfo } from "node:net";
import { SQL_ATTACKS } from "@meritory/security-testing";
import { afterEach, describe, expect, it } from "vitest";
import type { RunRequest, RunResult } from "./run.ts";
import {
  createRunnerServer,
  parseRequest,
  readSlots,
  slotPool,
} from "./server.ts";

const TOKEN = "t".repeat(40);
const PASSED: RunResult = { version: 3, status: "pass", tests: [] };

const valid = {
  language: "python",
  code: "class Solution: pass",
  signature: { function: "pricePair", params: [], returns: "int[]" },
  cases: [{ uuid: "a", description: "one", input: {}, expected: [] }],
};

let close: (() => void) | null = null;
afterEach(() => close?.());

async function start(
  run: (request: RunRequest, slot: number) => Promise<RunResult>,
  slots = 1,
  deadlineMs?: number,
) {
  const server = createRunnerServer({
    token: TOKEN,
    slots,
    waiting: 1,
    deadlineMs,
    run,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  const { port } = server.address() as AddressInfo;
  return (body: unknown, token = TOKEN) =>
    fetch(`http://127.0.0.1:${port}/runs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
}

describe("runner server", () => {
  it("runs a valid request in a slot", async () => {
    const slots: number[] = [];
    const post = await start(async (_request, slot) => {
      slots.push(slot);
      return PASSED;
    });
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PASSED);
    expect(slots).toEqual([0]);
  });

  it("refuses a missing or wrong token", async () => {
    const post = await start(async () => PASSED);
    expect((await post(valid, "")).status).toBe(401);
    expect((await post(valid, `${TOKEN}x`)).status).toBe(401);
  });

  it("refuses bodies that aren't a run", async () => {
    const post = await start(async () => PASSED);
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ ...valid, language: "ruby" })).status).toBe(400);
    expect((await post({ ...valid, code: "x".repeat(70 * 1024) })).status).toBe(
      400,
    );
    for (const attack of SQL_ATTACKS) {
      const res = await post({ ...valid, signature: { function: attack } });
      expect(res.status).toBe(400);
    }
  });

  it("says it's busy once every slot and the line are full", async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const post = await start(async () => {
      await held;
      return PASSED;
    });
    const first = post(valid);
    const second = post(valid);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const third = await post(valid);
    expect(third.status).toBe(429);
    expect(await third.json()).toEqual({ code: "runner_busy" });
    release();
    expect((await first).status).toBe(200);
    expect((await second).status).toBe(200);
  });

  it("fails a run that never finishes and gives its slot back", async () => {
    const slots: number[] = [];
    let calls = 0;
    const post = await start(
      (_request, slot) => {
        slots.push(slot);
        calls += 1;
        return calls === 1 ? new Promise(() => {}) : Promise.resolve(PASSED);
      },
      1,
      100,
    );
    const stuck = await post(valid);
    expect(stuck.status).toBe(500);
    expect(await stuck.json()).toEqual({ code: "runner_failed" });
    expect((await post(valid)).status).toBe(200);
    expect(slots).toEqual([0, 0]);
  });
});

describe("slotPool", () => {
  it("hands a freed slot to the next run waiting", async () => {
    const pool = slotPool(1, 1);
    const first = await pool.take();
    const waiting = pool.take();
    expect(pool.take()).toBeNull();
    pool.give(first as number);
    expect(await waiting).toBe(0);
  });
});

describe("readSlots", () => {
  it("takes a whole number from 1 up and refuses anything else", () => {
    expect(readSlots(undefined, 2)).toBe(2);
    expect(readSlots("3", 2)).toBe(3);
    for (const text of ["", "0", "-1", "1.5", "two", "NaN", "1e3", " 2"]) {
      expect(readSlots(text, 2)).toBeNull();
    }
  });
});

describe("parseRequest", () => {
  it("keeps only the four fields", () => {
    const parsed = parseRequest({ ...valid, extra: true }) as RunRequest;
    expect(Object.keys(parsed).sort()).toEqual([
      "cases",
      "code",
      "language",
      "signature",
    ]);
  });
});
