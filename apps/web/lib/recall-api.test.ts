import { RECALL_ERRORS } from "@meritory/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INTERVIEW_ERRORS, saveInterviewDate, undoReview } from "./recall-api";
import { UNDO_ERRORS } from "./recall-sitting";

const ID = "0b6f3c1e-8a3d-4f7a-9c2e-5d1b7e9f0a12";

const reply = (status: number, body?: object | string) =>
  vi.fn(
    async () =>
      new Response(
        typeof body === "string" ? body : body ? JSON.stringify(body) : null,
        { status },
      ),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recall api", () => {
  it("uses the same undo error codes as the API contract", () => {
    expect(UNDO_ERRORS).toEqual({
      notLatest: RECALL_ERRORS.notLatest,
      undoExpired: RECALL_ERRORS.undoExpired,
    });
  });

  it("uses the same interview date codes as the API contract", () => {
    expect(INTERVIEW_ERRORS).toEqual({
      notADate: RECALL_ERRORS.notADate,
      datePassed: RECALL_ERRORS.datePassed,
    });
  });

  it("saves or clears the interview date with PUT", async () => {
    const saved = {
      date: "2026-12-14",
      startsOn: "2026-11-16",
      status: "on",
      target: 0.95,
    };
    const fetch = reply(200, saved);
    vi.stubGlobal("fetch", fetch);
    expect(await saveInterviewDate("2026-12-14")).toEqual({
      ok: true,
      data: saved,
    });
    await saveInterviewDate(null);
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/v1/me/interview-date",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ date: null }),
      }),
    );
  });

  it("undoes with POST on the review's own path", async () => {
    const card = {
      trackId: "dsa",
      chapterId: "arrays",
      cardId: "c",
      dueAt: "2026-11-20T15:00:00.000Z",
    };
    const fetch = reply(200, card);
    vi.stubGlobal("fetch", fetch);
    expect(await undoReview(ID)).toEqual({ ok: true, data: card });
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/recall/reviews/${ID}/undo`,
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });

  it("passes on the API's error code", async () => {
    vi.stubGlobal("fetch", reply(409, { code: "undo_expired", message: "x" }));
    expect(await undoReview(ID)).toEqual({
      ok: false,
      reason: "failed",
      code: "undo_expired",
    });
  });

  it("has no code when the body isn't the API's", async () => {
    vi.stubGlobal("fetch", reply(502, "<html>Bad gateway</html>"));
    expect(await undoReview(ID)).toEqual({ ok: false, reason: "failed" });
  });

  it("reports a dropped connection as failed, with no code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await undoReview(ID)).toEqual({ ok: false, reason: "failed" });
  });

  it("keeps an id with path characters inside the path", async () => {
    const fetch = reply(404, { code: "not_found" });
    vi.stubGlobal("fetch", fetch);
    await undoReview("../me");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/recall/reviews/..%2Fme/undo",
      expect.anything(),
    );
  });
});
