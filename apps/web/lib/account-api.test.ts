import { SESSION_ERRORS as CONTRACT } from "@meritory/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmPassword,
  deleteAccount,
  endSession,
  listSessions,
  SESSION_ERRORS,
} from "./account-api";

const reply = (status: number, body?: object, headers: object = {}) =>
  vi.fn(
    async () =>
      new Response(body ? JSON.stringify(body) : null, {
        status,
        headers: headers as HeadersInit,
      }),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("account api", () => {
  it("uses the same error codes as the API contract", () => {
    expect(SESSION_ERRORS).toEqual(CONTRACT);
  });

  it("calls the same-origin API path", async () => {
    const fetch = reply(200, { sessions: [] });
    vi.stubGlobal("fetch", fetch);
    expect(await listSessions()).toEqual({ ok: true, data: { sessions: [] } });
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/me/sessions",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("deletes the account with DELETE on /me itself", async () => {
    const fetch = reply(204);
    vi.stubGlobal("fetch", fetch);
    expect(await deleteAccount()).toEqual({ ok: true, data: undefined });
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/me",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("escapes the session id in the path", async () => {
    const fetch = reply(204);
    vi.stubGlobal("fetch", fetch);
    await endSession("../confirm-password");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/me/sessions/..%2Fconfirm-password",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it.each([
    [403, { code: "confirm_password" }, {}, { reason: "confirm_password" }],
    [400, { code: "wrong_password" }, {}, { reason: "wrong_password" }],
    [
      429,
      { code: "rate_limited" },
      { "retry-after": "42" },
      { reason: "rate_limited", retryAfter: "42" },
    ],
    [404, { code: "not_found" }, {}, { reason: "gone" }],
    [401, { code: "unauthorized" }, {}, { reason: "signed_out" }],
    [403, { code: "forbidden" }, {}, { reason: "failed" }],
    [500, undefined, {}, { reason: "failed" }],
  ])("turns %i %j into a reason", async (status, body, headers, result) => {
    vi.stubGlobal("fetch", reply(status, body, headers));
    expect(await confirmPassword("x")).toEqual({ ok: false, ...result });
  });

  it("treats a dropped connection as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await listSessions()).toEqual({ ok: false, reason: "failed" });
  });
});
