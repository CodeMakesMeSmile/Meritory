import Type from "typebox";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

const ANNA = {
  id: "0b6f8f1e-6d2a-4c47-9a39-2f4a1c1d5e10",
  name: "Anna",
  email: "anna@example.com",
};

async function start(
  databaseUp: boolean,
  handleAuth = async (_request: Request) => new Response(null),
  currentUser = async (headers: Headers) =>
    headers.get("cookie") === "session=good" ? ANNA : null,
) {
  app = await buildApp({
    pingDatabase: async () => databaseUp,
    handleAuth,
    publicApiUrl: "https://meritory.test/api",
    currentUser,
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
      ...ANNA,
      emailVerified: true,
    }));
    const res = await app.inject({ url: "/v1/me" });
    expect(Object.keys(res.json())).toEqual(["id", "name", "email"]);
  });

  it("leaves public routes alone", async () => {
    const res = await (await start(true)).inject("/v1/health/live");
    expect(res.statusCode).toBe(200);
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
