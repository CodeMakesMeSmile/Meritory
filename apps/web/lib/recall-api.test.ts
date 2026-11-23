import { RECALL_ERRORS } from "@meritory/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INTERVIEW_ERRORS,
  REVIEW_ERRORS,
  type RecallSessionCard,
  saveInterviewDate,
  saveReview,
  undoReview,
} from "./recall-api";
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

  it("uses the same review code as the API contract", () => {
    expect(REVIEW_ERRORS).toEqual({ undone: RECALL_ERRORS.reviewUndone });
  });

  it("answers a retried rating that was undone since with no data", async () => {
    const card = {
      trackId: "dsa",
      chapterId: "arrays",
      cardId: "c",
      version: 1,
    };
    const review = {
      id: ID,
      card: card as RecallSessionCard,
      rating: "good" as const,
      answeredAt: new Date("2026-11-19T15:00:00.000Z"),
      durationMs: 4000,
    };
    vi.stubGlobal(
      "fetch",
      reply(409, { code: RECALL_ERRORS.reviewUndone, message: "x" }),
    );
    expect(await saveReview(review)).toEqual({ ok: true, data: null });
    vi.stubGlobal("fetch", reply(409, { code: "conflict", message: "x" }));
    expect(await saveReview(review)).toEqual({
      ok: false,
      reason: "failed",
      code: "conflict",
      refused: true,
    });
  });

  const rating = (durationMs: number) => ({
    id: ID,
    card: {
      trackId: "dsa",
      chapterId: "arrays",
      cardId: "c",
      version: 1,
    } as RecallSessionCard,
    rating: "good" as const,
    answeredAt: new Date("2026-11-19T15:00:00.000Z"),
    durationMs,
  });

  it.each([400, 404, 409, 413, 422])(
    "marks a %i as refused, since sending it again can't work",
    async (status) => {
      vi.stubGlobal("fetch", reply(status, { code: "x", message: "x" }));
      expect(await saveReview(rating(4000))).toMatchObject({
        ok: false,
        refused: true,
      });
    },
  );

  it.each([408, 429, 500, 502, 503])(
    "leaves a %i open to another try",
    async (status) => {
      vi.stubGlobal("fetch", reply(status, { code: "x", message: "x" }));
      const result = await saveReview(rating(4000));
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("refused");
    },
  );

  it("leaves a dropped connection open to another try", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await saveReview(rating(4000))).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("caps the time on a card left open past a day", async () => {
    const fetch = reply(200, { dueAt: "2026-11-20T15:00:00.000Z" });
    vi.stubGlobal("fetch", fetch);
    await saveReview(rating(3 * 86_400_000));
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).durationMs).toBe(86_400_000);
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
      refused: true,
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
