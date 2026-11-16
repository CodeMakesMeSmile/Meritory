import { describe, expect, it } from "vitest";
import {
  type BreachCheckOptions,
  createBreachCheck,
  foundIn,
  RANGE_URL,
} from "./breached-passwords.ts";

// SHA-1 of "password", split where the range API splits it
const PREFIX = "5BAA6";
const SUFFIX = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";

function setup(answer: (url: string, init?: RequestInit) => Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const unavailable: string[] = [];
  const options: BreachCheckOptions = {
    onUnavailable: (reason) => void unavailable.push(reason),
    fetch: (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return answer(url, init);
    }) as typeof fetch,
    timeoutMs: 50,
  };
  return { check: createBreachCheck(options), calls, unavailable };
}

describe("createBreachCheck", () => {
  it("sends only the first 5 characters of the hash, with padding asked for", async () => {
    const { check, calls } = setup(async () => new Response(""));
    await check("password");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${RANGE_URL}${PREFIX}`);
    expect(calls[0]?.url).not.toContain(SUFFIX);
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("Add-Padding")).toBe("true");
    expect(headers.get("User-Agent")).toBe("Meritory");
  });

  it("finds a breached password", async () => {
    const { check, unavailable } = setup(
      async () =>
        new Response(
          `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:10434004\r\n`,
        ),
    );
    expect(await check("password")).toBe(true);
    expect(unavailable).toEqual([]);
  });

  it("lets through a password that isn't listed", async () => {
    const { check } = setup(
      async () => new Response("0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n"),
    );
    expect(await check("password")).toBe(false);
  });

  it("ignores padding lines with a count of 0", async () => {
    const { check } = setup(async () => new Response(`${SUFFIX}:0\r\n`));
    expect(await check("password")).toBe(false);
  });

  it("lets the password through and reports it when the service errors", async () => {
    const { check, unavailable } = setup(
      async () => new Response("busy", { status: 503 }),
    );
    expect(await check("password")).toBe(false);
    expect(unavailable).toEqual(["status 503"]);
  });

  it("lets the password through when the service can't be reached", async () => {
    const { check, unavailable } = setup(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await check("password")).toBe(false);
    expect(unavailable).toEqual(["TypeError"]);
  });

  it("gives up after the timeout", async () => {
    const { check, unavailable } = setup(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );
    expect(await check("password")).toBe(false);
    expect(unavailable).toEqual(["TimeoutError"]);
  });
});

describe("foundIn", () => {
  it("matches the suffix whatever its case", () => {
    expect(foundIn(`${SUFFIX.toLowerCase()}:3`, SUFFIX)).toBe(true);
  });

  it("doesn't match an empty body", () => {
    expect(foundIn("", SUFFIX)).toBe(false);
  });
});
