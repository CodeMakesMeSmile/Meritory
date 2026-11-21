import { randomUUID } from "node:crypto";
import { SQL_ATTACKS } from "@meritory/security-testing";
import type { RecallStore } from "@meritory/server";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import {
  CODE_RUN_LIMIT,
  type CodeRunner,
  createCodeRunner,
  type RunnerAnswer,
} from "./code.ts";
import type { CurrentSession } from "./session.ts";
import { builtContent } from "./test-content.ts";

const ORIGIN = "https://meritory.test";
const URL = "/v1/code/runs";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

const UNREACHABLE = new Proxy({} as RecallStore, {
  get: () => () => {
    throw new Error("A code run reached the recall store");
  },
});

const SIGNED_IN: CurrentSession = {
  user: { id: randomUUID(), name: "Anna", email: "anna@example.com" },
  sessionId: randomUUID(),
  fresh: true,
};

const PASSED = { version: 3 as const, status: "pass" as const, tests: [] };

async function start(codeRunner?: CodeRunner) {
  app = await buildApp({
    pingDatabase: async () => true,
    handleAuth: async () => new Response(null),
    publicApiUrl: `${ORIGIN}/api`,
    webOrigin: ORIGIN,
    currentSession: async (headers) =>
      headers.get("cookie") === "session=good" ? SIGNED_IN : null,
    accountSessions: UNREACHABLE as never,
    signInMethods: UNREACHABLE as never,
    accountDeletion: UNREACHABLE as never,
    content: await builtContent(),
    recall: UNREACHABLE,
    codeRunner,
  });
  return app;
}

const body = (over: Record<string, unknown> = {}) => ({
  trackId: "dsa",
  chapterId: "arrays-and-hashing",
  exerciseId: "price-pair",
  language: "python",
  code: "class Solution: pass",
  ...over,
});

const post = (
  api: NonNullable<typeof app>,
  payload: unknown,
  cookie = "session=good",
) =>
  api.inject({
    method: "POST",
    url: URL,
    headers: { cookie, origin: ORIGIN },
    payload: payload as object,
  });

function runner(answer: RunnerAnswer, seen: unknown[] = []): CodeRunner {
  return {
    async run(request) {
      seen.push(request);
      return answer;
    },
  };
}

describe("code runs", () => {
  it("sends the exercise's signature and cases to the runner", async () => {
    const seen: { signature: { function: string }; cases: unknown[] }[] = [];
    const api = await start(runner({ kind: "ok", result: PASSED }, seen));
    const res = await post(api, body());
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(PASSED);
    expect(seen[0]?.signature.function).toBe("pricePair");
    expect(seen[0]?.cases.length).toBeGreaterThan(0);
  });

  it("needs a session", async () => {
    const api = await start(runner({ kind: "ok", result: PASSED }));
    expect((await post(api, body(), "")).statusCode).toBe(401);
  });

  it("refuses an unknown exercise, a design exercise, and bad bodies", async () => {
    const api = await start(runner({ kind: "ok", result: PASSED }));
    expect((await post(api, body({ exerciseId: "nope" }))).statusCode).toBe(
      404,
    );
    const design = await post(
      api,
      body({
        trackId: "system-design",
        chapterId: "case-studies",
        exerciseId: "unified-data-api",
      }),
    );
    expect(design.statusCode).toBe(404);
    expect((await post(api, body({ language: "ruby" }))).statusCode).toBe(400);
    expect(
      (await post(api, body({ code: "x".repeat(65537) }))).statusCode,
    ).toBe(400);
    expect((await post(api, { ...body(), extra: 1 })).statusCode).toBe(400);
    for (const attack of SQL_ATTACKS) {
      expect((await post(api, body({ exerciseId: attack }))).statusCode).toBe(
        400,
      );
    }
  });

  it("says plainly when the runner isn't set up or isn't running", async () => {
    for (const api of [
      await start(),
      await start(runner({ kind: "offline" })),
    ]) {
      const res = await post(api, body());
      expect(res.statusCode).toBe(503);
      expect(res.json().code).toBe("runner_offline");
      await api.close();
    }
    app = undefined;
  });

  it("passes on a busy runner and a failed run", async () => {
    let api = await start(runner({ kind: "busy" }));
    expect((await post(api, body())).json().code).toBe("runner_busy");
    await api.close();
    api = await start(runner({ kind: "failed" }));
    const failed = await post(api, body());
    expect(failed.statusCode).toBe(502);
    expect(failed.json().code).toBe("runner_failed");
  });

  it("limits how often each user can run code", async () => {
    const api = await start(runner({ kind: "ok", result: PASSED }));
    for (let i = 0; i < CODE_RUN_LIMIT; i++) {
      expect((await post(api, body())).statusCode).toBe(200);
    }
    expect((await post(api, body())).statusCode).toBe(429);
  });
});

describe("createCodeRunner", () => {
  const request = {
    language: "python" as const,
    code: "",
    signature: {},
    cases: [],
  };

  it("sends the token and reads the result", async () => {
    const calls: [string, RequestInit][] = [];
    const client = createCodeRunner({
      url: "http://localhost:4100",
      token: "secret",
      fetch: (async (url: string, init: RequestInit) => {
        calls.push([url, init]);
        return new Response(JSON.stringify(PASSED), { status: 200 });
      }) as typeof fetch,
    });
    expect(await client.run(request)).toEqual({ kind: "ok", result: PASSED });
    expect(calls[0]?.[0]).toBe("http://localhost:4100/runs");
    expect(
      (calls[0]?.[1]?.headers as Record<string, string> | undefined)
        ?.authorization,
    ).toBe("Bearer secret");
  });

  it("names a refused connection offline and a 429 busy", async () => {
    const refused = createCodeRunner({
      url: "http://localhost:4100",
      token: "t",
      fetch: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    });
    expect(await refused.run(request)).toEqual({ kind: "offline" });
    const busy = createCodeRunner({
      url: "http://localhost:4100",
      token: "t",
      fetch: (async () => new Response("{}", { status: 429 })) as typeof fetch,
    });
    expect(await busy.run(request)).toEqual({ kind: "busy" });
  });
});
