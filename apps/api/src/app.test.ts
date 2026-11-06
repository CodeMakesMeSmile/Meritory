import Type from "typebox";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

async function start(
  databaseUp: boolean,
  handleAuth = async (_request: Request) => new Response(null),
) {
  app = await buildApp({
    pingDatabase: async () => databaseUp,
    handleAuth,
    publicApiUrl: "https://meritory.test/api",
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

describe("openapi", () => {
  it("documents the versioned routes", async () => {
    const res = await (await start(true)).inject("/v1/openapi.json");
    const spec = res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining(["/v1/health/live", "/v1/health/ready"]),
    );
  });
});
