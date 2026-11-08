import Type from "typebox";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import type { AccountSessionStore, CurrentSession } from "./session.ts";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

const ORIGIN = "https://meritory.test";

const ANNA = {
  id: "0b6f8f1e-6d2a-4c47-9a39-2f4a1c1d5e10",
  name: "Anna",
  email: "anna@example.com",
};

const HERE = "11111111-1111-4111-8111-111111111111";
const PHONE = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";

const SESSIONS: Record<string, CurrentSession> = {
  "session=good": { user: ANNA, sessionId: HERE, fresh: true },
  "session=stale": { user: ANNA, sessionId: HERE, fresh: false },
};

// Anna's own sessions, plus a stranger's she must not be able to end
function fakeStore() {
  const owners = new Map([
    [HERE, ANNA.id],
    [PHONE, ANNA.id],
    [STRANGER, "someone-else"],
  ]);
  const calls: string[] = [];
  const store: AccountSessionStore = {
    async list() {
      return [
        {
          id: PHONE,
          device: "Firefox on macOS",
          signedInAt: new Date("2026-11-01T09:00:00Z"),
          lastActiveAt: new Date("2026-11-07T09:00:00Z"),
        },
        {
          id: HERE,
          device: "Chrome on Windows",
          signedInAt: new Date("2026-11-03T09:00:00Z"),
          lastActiveAt: new Date("2026-11-06T09:00:00Z"),
        },
      ];
    },
    async end(userId, sessionId) {
      calls.push(`end ${sessionId}`);
      if (owners.get(sessionId) !== userId) return false;
      owners.delete(sessionId);
      return true;
    },
    async endOthers(_userId, keepId) {
      calls.push(`endOthers ${keepId}`);
      return 1;
    },
    async confirmPassword({ password }) {
      calls.push("confirm");
      if (password === "too many") {
        return { ok: false, reason: "rate_limited", retryAfter: 600 };
      }
      return password === "right password"
        ? { ok: true }
        : { ok: false, reason: "wrong_password" };
    },
  };
  return { store, calls };
}

async function start(
  databaseUp: boolean,
  handleAuth = async (_request: Request) => new Response(null),
  currentSession = async (headers: Headers) =>
    SESSIONS[headers.get("cookie") ?? ""] ?? null,
  accountSessions = fakeStore().store,
) {
  app = await buildApp({
    pingDatabase: async () => databaseUp,
    handleAuth,
    publicApiUrl: `${ORIGIN}/api`,
    webOrigin: ORIGIN,
    currentSession,
    accountSessions,
  });
  return app;
}

afterEach(async () => {
  await app?.close();
});

describe("health", () => {
  it("reports live without touching the database", async () => {
    const res = await (await start(false)).inject("/v1/health/live");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("reports ready when the database answers", async () => {
    const res = await (await start(true)).inject("/v1/health/ready");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok", checks: { database: "ok" } });
  });

  it("returns 503 when the database is down", async () => {
    const res = await (await start(false)).inject("/v1/health/ready");
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      status: "down",
      checks: { database: "down" },
    });
  });
});

describe("errors", () => {
  it("returns a stable error code for unknown routes", async () => {
    const res = await (await start(true)).inject("/v1/nope");
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ code: "not_found" });
  });

  it("uses our own code for validation errors", async () => {
    const app = await start(true);
    app.get(
      "/check",
      { schema: { querystring: Type.Object({ n: Type.Integer() }) } },
      async () => ({}),
    );
    const res = await app.inject("/check?n=abc");
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "validation_failed" });
  });
});

describe("auth routes", () => {
  it("hands Better Auth the public URL, not the Host header", async () => {
    let seen: Request | undefined;
    const app = await start(true, async (request) => {
      seen = request;
      return new Response(null);
    });
    await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in/email?next=today",
      headers: { host: "evil.example" },
      payload: { email: "a@b.test", password: "x" },
    });
    expect(seen?.url).toBe(
      "https://meritory.test/api/v1/auth/sign-in/email?next=today",
    );
    expect(seen?.headers.get("host")).toBeNull();
    expect(await seen?.json()).toEqual({ email: "a@b.test", password: "x" });
  });

  it("passes the status, body, and every cookie back", async () => {
    const app = await start(true, async () => {
      const headers = new Headers({ "content-type": "application/json" });
      headers.append("set-cookie", "a=1; Path=/");
      headers.append("set-cookie", "b=2; Path=/");
      return new Response(JSON.stringify({ code: "INVALID_EMAIL" }), {
        status: 400,
        headers,
      });
    });
    const res = await app.inject("/v1/auth/get-session");
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ code: "INVALID_EMAIL" });
    expect(res.headers["set-cookie"]).toEqual(["a=1; Path=/", "b=2; Path=/"]);
  });
});

describe("signed-in routes", () => {
  it("returns the user for a valid session", async () => {
    const res = await (await start(true)).inject({
      url: "/v1/me",
      headers: { cookie: "session=good" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(ANNA);
  });

  it("returns 401 without a session", async () => {
    const res = await (await start(true)).inject("/v1/me");
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: "unauthorized" });
  });

  it("returns 401 for a session the server doesn't know", async () => {
    const res = await (await start(true)).inject({
      url: "/v1/me",
      headers: { cookie: "session=revoked" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("only sends the fields in the contract", async () => {
    const app = await start(true, undefined, async () => ({
      user: { ...ANNA, emailVerified: true },
      sessionId: HERE,
      fresh: true,
    }));
    const res = await app.inject({ url: "/v1/me" });
    expect(Object.keys(res.json())).toEqual(["id", "name", "email"]);
  });

  it("leaves public routes alone", async () => {
    const res = await (await start(true)).inject("/v1/health/live");
    expect(res.statusCode).toBe(200);
  });
});

describe("sessions", () => {
  const as = (cookie: string, headers: Record<string, string> = {}) => ({
    cookie,
    origin: ORIGIN,
    "sec-fetch-site": "same-origin",
    ...headers,
  });

  it("lists sessions with this device first and no tokens", async () => {
    const res = await (await start(true)).inject({
      url: "/v1/me/sessions",
      headers: { cookie: "session=good" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      sessions: [
        {
          id: HERE,
          device: "Chrome on Windows",
          signedInAt: "2026-11-03T09:00:00.000Z",
          lastActiveAt: "2026-11-06T09:00:00.000Z",
          current: true,
        },
        {
          id: PHONE,
          device: "Firefox on macOS",
          signedInAt: "2026-11-01T09:00:00.000Z",
          lastActiveAt: "2026-11-07T09:00:00.000Z",
          current: false,
        },
      ],
    });
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("lists even when the sign-in is over a day old", async () => {
    const res = await (await start(true)).inject({
      url: "/v1/me/sessions",
      headers: { cookie: "session=stale" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("signs out another of my sessions", async () => {
    const res = await (await start(true)).inject({
      method: "DELETE",
      url: `/v1/me/sessions/${PHONE}`,
      headers: as("session=good"),
    });
    expect(res.statusCode).toBe(204);
  });

  it("answers 404 for someone else's session and ends nothing", async () => {
    const { store, calls } = fakeStore();
    const app = await start(true, undefined, undefined, store);
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/me/sessions/${STRANGER}`,
      headers: as("session=good"),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ code: "not_found" });
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: `/v1/me/sessions/${STRANGER}`,
          headers: as("session=good"),
        })
      ).statusCode,
    ).toBe(404);
    expect(calls).toEqual([`end ${STRANGER}`, `end ${STRANGER}`]);
  });

  it("won't end this session, which Sign out is for", async () => {
    const res = await (await start(true)).inject({
      method: "DELETE",
      url: `/v1/me/sessions/${HERE}`,
      headers: as("session=good"),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "current_session" });
  });

  it("rejects an id that isn't a UUID before touching the database", async () => {
    const { store, calls } = fakeStore();
    const res = await (await start(true, undefined, undefined, store)).inject({
      method: "DELETE",
      url: "/v1/me/sessions/1'%20OR%20'1'='1",
      headers: as("session=good"),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "validation_failed" });
    expect(calls).toEqual([]);
  });

  it.each([
    ["one session", "DELETE", `/v1/me/sessions/${PHONE}`],
    ["every other session", "POST", "/v1/me/sessions/end-others"],
  ] as const)(
    "asks for the password before ending %s when the sign-in is old",
    async (_name, method, url) => {
      const { store, calls } = fakeStore();
      const res = await (await start(true, undefined, undefined, store)).inject(
        { method, url, headers: as("session=stale") },
      );
      expect(res.statusCode).toBe(403);
      expect(res.json()).toMatchObject({ code: "confirm_password" });
      expect(calls).toEqual([]);
    },
  );

  it("ends every other session and keeps this one", async () => {
    const { store, calls } = fakeStore();
    const res = await (await start(true, undefined, undefined, store)).inject({
      method: "POST",
      url: "/v1/me/sessions/end-others",
      headers: as("session=good"),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ended: 1 });
    expect(calls).toEqual([`endOthers ${HERE}`]);
  });

  it.each([
    ["right password", 204, undefined],
    ["wrong password", 400, "wrong_password"],
    ["too many", 429, "rate_limited"],
  ])("confirms the password: %s", async (password, status, code) => {
    const res = await (await start(true)).inject({
      method: "POST",
      url: "/v1/me/confirm-password",
      headers: as("session=stale"),
      payload: { password },
    });
    expect(res.statusCode).toBe(status);
    if (code) expect(res.json()).toMatchObject({ code });
    if (status === 429) expect(res.headers["retry-after"]).toBe("600");
  });

  it("refuses extra fields when confirming", async () => {
    const res = await (await start(true)).inject({
      method: "POST",
      url: "/v1/me/confirm-password",
      headers: as("session=stale"),
      payload: { password: "right password", userId: "someone-else" },
    });
    expect(res.statusCode).toBe(400);
  });

  it.each([
    ["another site's Origin", { origin: "https://evil.example" }],
    ["a cross-site fetch", { "sec-fetch-site": "cross-site" }],
    ["a sibling subdomain", { "sec-fetch-site": "same-site" }],
  ])("refuses changes from %s", async (_name, headers) => {
    const { store, calls } = fakeStore();
    const app = await start(true, undefined, undefined, store);
    for (const request of [
      { method: "DELETE" as const, url: `/v1/me/sessions/${PHONE}` },
      { method: "POST" as const, url: "/v1/me/sessions/end-others" },
      {
        method: "POST" as const,
        url: "/v1/me/confirm-password",
        payload: { password: "right password" },
      },
    ]) {
      const res = await app.inject({
        ...request,
        headers: as("session=good", headers),
      });
      expect(res.statusCode).toBe(403);
      expect(res.json()).toMatchObject({ code: "forbidden" });
    }
    expect(calls).toEqual([]);
  });

  it("accepts the phone app, which sends no Origin", async () => {
    const res = await (await start(true)).inject({
      method: "POST",
      url: "/v1/me/sessions/end-others",
      headers: { cookie: "session=good" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("refuses every session route without a session", async () => {
    const app = await start(true);
    for (const [method, url] of [
      ["GET", "/v1/me/sessions"],
      ["DELETE", `/v1/me/sessions/${PHONE}`],
      ["POST", "/v1/me/sessions/end-others"],
      ["POST", "/v1/me/confirm-password"],
    ] as const) {
      const res = await app.inject({
        method,
        url,
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
      });
      expect(res.statusCode).toBe(401);
    }
  });
});

describe("security headers", () => {
  it.each([
    ["a success", "/v1/health/live"],
    ["a 404", "/v1/nope"],
    ["a 401", "/v1/me"],
    ["an auth route", "/v1/auth/get-session"],
  ])("sends nosniff on %s", async (_name, url) => {
    const res = await (await start(true)).inject(url);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("never lets a cache keep personal data", async () => {
    const app = await start(true);
    const signedIn = await app.inject({
      url: "/v1/me",
      headers: { cookie: "session=good" },
    });
    const signedOut = await app.inject("/v1/me");
    const auth = await app.inject("/v1/auth/get-session");
    expect(signedIn.headers["cache-control"]).toBe("no-store");
    expect(signedOut.headers["cache-control"]).toBe("no-store");
    expect(auth.headers["cache-control"]).toBe("no-store");
  });

  it("keeps Better Auth's own cache rule when it sets one", async () => {
    const app = await start(
      true,
      async () =>
        new Response(null, { headers: { "cache-control": "max-age=60" } }),
    );
    const res = await app.inject("/v1/auth/ok");
    expect(res.headers["cache-control"]).toBe("max-age=60");
  });

  it("lets public routes be cached", async () => {
    const res = await (await start(true)).inject("/v1/health/live");
    expect(res.headers["cache-control"]).toBeUndefined();
  });
});

describe("openapi", () => {
  it("documents the versioned routes", async () => {
    const res = await (await start(true)).inject("/v1/openapi.json");
    const spec = res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining(["/v1/health/live", "/v1/health/ready", "/v1/me"]),
    );
  });
});
