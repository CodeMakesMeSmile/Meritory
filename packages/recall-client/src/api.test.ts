import { RECALL_ERRORS } from "@meritory/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRecallApi,
  REVIEW_ERRORS,
  type RecallSessionCard,
} from "./api.ts";
import { UNDO_ERRORS } from "./sitting.ts";

const { resetSettings, saveSettings, saveReview, undoReview } =
  createRecallApi();

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

  it("sends only the settings that changed", async () => {
    const fetch = reply(200, { settings: {} });
    vi.stubGlobal("fetch", fetch);
    await saveSettings({ newCardsPerDay: 20, interviewDate: null });
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/v1/me/settings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ newCardsPerDay: 20, interviewDate: null }),
      }),
    );
    await resetSettings();
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/v1/me/settings/reset",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("passes on each setting the API turned down", async () => {
    const problems = [
      { field: "newCardsPerDay", message: "Pick a number from 0 to 50." },
    ];
    vi.stubGlobal(
      "fetch",
      reply(400, {
        code: "settings_out_of_range",
        message: "Some settings can't be saved.",
        problems: [...problems, { field: 3 }],
      }),
    );
    expect(await saveSettings({ newCardsPerDay: 80 })).toEqual({
      ok: false,
      reason: "failed",
      code: "settings_out_of_range",
      problems,
      refused: true,
    });
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

describe("recall api on another origin", () => {
  it("calls the given base address with the given headers and credentials", async () => {
    const fetch = reply(200, { newLeftToday: 0, cards: [] });
    vi.stubGlobal("fetch", fetch);
    const api = createRecallApi({
      baseUrl: "https://app.example/api/v1",
      headers: async () => ({ cookie: "session=abc" }),
      credentials: "omit",
    });
    await api.loadSession();
    expect(fetch).toHaveBeenCalledWith(
      "https://app.example/api/v1/recall/session",
      expect.objectContaining({
        credentials: "omit",
        headers: { cookie: "session=abc" },
      }),
    );
  });

  it("keeps the content type next to the given headers", async () => {
    const fetch = reply(204);
    vi.stubGlobal("fetch", fetch);
    const api = createRecallApi({ headers: () => ({ cookie: "session=abc" }) });
    await api.saveTimeZone("America/Toronto");
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({
      cookie: "session=abc",
      "content-type": "application/json",
    });
  });

  it("answers failed when the headers can't be read", async () => {
    vi.stubGlobal("fetch", reply(200, {}));
    const api = createRecallApi({
      headers: async () => {
        throw new Error("no cookie store");
      },
    });
    expect(await api.loadDue()).toEqual({ ok: false, reason: "failed" });
  });
});
