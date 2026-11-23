import { randomUUID } from "node:crypto";
import { SQL_ATTACKS } from "@meritory/security-testing";
import {
  createDatabase,
  createRecallStore,
  type RecallStore,
} from "@meritory/server";
import { testUsers } from "@meritory/server/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import type { ServedContent } from "./content.ts";
import { RECALL_LIMITS } from "./recall.ts";
import type { CurrentSession } from "./session.ts";
import { builtContent } from "./test-content.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
// 9 a.m. in Toronto
const NINE_AM = new Date("2026-11-19T14:00:00Z");

const START = "/v1/recall/tracks/dsa/chapters/arrays-and-hashing/start";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

// Building the whole curriculum can take longer than one test's time limit when every file runs at once
beforeAll(async () => {
  await builtContent();
}, 60000);

afterEach(async () => {
  await app?.close();
  app = undefined;
});

// Fails the test if a refused request ever reaches the database
const UNREACHABLE = new Proxy({} as RecallStore, {
  get: () => () => {
    throw new Error("A refused request reached the store");
  },
});

const SIGNED_IN: CurrentSession = {
  user: { id: randomUUID(), name: "Anna", email: "anna@example.com" },
  sessionId: randomUUID(),
  fresh: true,
};

async function start(options: {
  recall: RecallStore;
  sessions?: Record<string, CurrentSession>;
  content?: ServedContent;
  now?: () => Date;
}) {
  const sessions = options.sessions ?? { "session=good": SIGNED_IN };
  app = await buildApp({
    pingDatabase: async () => true,
    handleAuth: async () => new Response(null),
    publicApiUrl: `${ORIGIN}/api`,
    webOrigin: ORIGIN,
    currentSession: async (headers) =>
      sessions[headers.get("cookie") ?? ""] ?? null,
    accountSessions: UNREACHABLE as never,
    signInMethods: UNREACHABLE as never,
    accountDeletion: UNREACHABLE as never,
    content: options.content ?? (await builtContent()),
    recall: options.recall,
    now: options.now,
  });
  return app;
}

const review = (over: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  trackId: "dsa",
  chapterId: "arrays-and-hashing",
  cardId: "array-operation-costs",
  cardVersion: 1,
  rating: "good",
  answeredAt: NINE_AM.toISOString(),
  durationMs: 5000,
  ...over,
});

describe("recall routes refuse bad requests before the database", () => {
  const routes = [
    { method: "POST" as const, url: START },
    { method: "GET" as const, url: "/v1/recall/due" },
    { method: "GET" as const, url: "/v1/recall/session" },
    { method: "POST" as const, url: "/v1/recall/reviews", payload: review() },
    {
      method: "POST" as const,
      url: `/v1/recall/reviews/${randomUUID()}/undo`,
    },
    {
      method: "PUT" as const,
      url: "/v1/me/time-zone",
      payload: { timeZone: "UTC" },
    },
    { method: "GET" as const, url: "/v1/me/interview-date" },
    {
      method: "PUT" as const,
      url: "/v1/me/interview-date",
      payload: { date: "2026-12-14" },
    },
  ];

  it("answers 401 without a session", async () => {
    const api = await start({ recall: UNREACHABLE });
    for (const route of routes) {
      const res = await api.inject({ ...route, headers: { origin: ORIGIN } });
      expect(res.statusCode, `${route.method} ${route.url}`).toBe(401);
    }
  });

  it("refuses changes from another site", async () => {
    const api = await start({ recall: UNREACHABLE });
    for (const route of routes.filter((r) => r.method !== "GET")) {
      const res = await api.inject({
        ...route,
        headers: { cookie: "session=good", origin: "https://evil.example" },
      });
      expect(res.statusCode, `${route.method} ${route.url}`).toBe(403);
    }
  });

  it("refuses attack strings in every id", async () => {
    const api = await start({ recall: UNREACHABLE });
    const headers = { cookie: "session=good", origin: ORIGIN };
    for (const attack of SQL_ATTACKS) {
      const part = encodeURIComponent(attack);
      for (const url of [
        `/v1/recall/tracks/${part}/chapters/arrays-and-hashing/start`,
        `/v1/recall/tracks/dsa/chapters/${part}/start`,
        `/v1/recall/reviews/${part}/undo`,
      ]) {
        const res = await api.inject({ method: "POST", url, headers });
        expect(res.statusCode, url).toBe(400);
      }
      for (const field of ["id", "trackId", "chapterId", "cardId"]) {
        const res = await api.inject({
          method: "POST",
          url: "/v1/recall/reviews",
          headers,
          payload: review({ [field]: attack }),
        });
        expect(res.statusCode, `${field} ${attack}`).toBe(400);
      }
      const res = await api.inject({
        method: "PUT",
        url: "/v1/me/time-zone",
        headers,
        payload: { timeZone: attack },
      });
      expect(res.statusCode, attack).toBe(400);
    }
  });

  it("refuses extra fields, bad ratings, and bad times", async () => {
    const api = await start({ recall: UNREACHABLE });
    const headers = { cookie: "session=good", origin: ORIGIN };
    for (const payload of [
      review({ userId: randomUUID() }),
      review({ rating: "forgot" }),
      review({ answeredAt: "yesterday" }),
      review({ cardVersion: 0 }),
      review({ durationMs: -1 }),
    ]) {
      const res = await api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers,
        payload,
      });
      expect(res.statusCode, JSON.stringify(payload)).toBe(400);
    }
  });

  it("refuses a time that fits the format but isn't a real moment", async () => {
    const api = await start({ recall: UNREACHABLE });
    for (const answeredAt of [
      "2026-12-31T23:59:60Z",
      "2026-11-19T14:00:00Z[UTC]",
    ]) {
      const res = await api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers: { cookie: "session=good", origin: ORIGIN },
        payload: review({ answeredAt }),
      });
      expect(res.statusCode, answeredAt).toBe(400);
      expect(res.json().code).toBe("validation_failed");
    }
  });

  it("refuses a body far bigger than a review", async () => {
    const api = await start({ recall: UNREACHABLE });
    const res = await api.inject({
      method: "POST",
      url: "/v1/recall/reviews",
      headers: { cookie: "session=good", origin: ORIGIN },
      payload: review({ padding: "x".repeat(4096) }),
    });
    expect(res.statusCode).toBe(413);
  });

  it("answers 404 for a chapter or card that isn't in the bundle", async () => {
    const api = await start({ recall: UNREACHABLE });
    const headers = { cookie: "session=good", origin: ORIGIN };
    const chapter = await api.inject({
      method: "POST",
      url: "/v1/recall/tracks/dsa/chapters/no-such-chapter/start",
      headers,
    });
    expect(chapter.statusCode).toBe(404);
    for (const payload of [
      review({ cardId: "no-such-card" }),
      review({ cardVersion: 99 }),
    ]) {
      const res = await api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers,
        payload,
      });
      expect(res.statusCode).toBe(404);
    }
  });
});

describe.skipIf(!url)("recall routes against Postgres", () => {
  const database = createDatabase(url ?? "");
  const store = createRecallStore(database.db);
  const accounts = testUsers(database.db);
  let content: ServedContent;
  let clock = NINE_AM;
  const now = () => clock;

  beforeAll(async () => {
    content = await builtContent();
  });

  afterAll(async () => {
    await accounts.removeAll();
    await database.close();
  });

  async function person() {
    const id = await accounts.create();
    const cookie = `session=${id}`;
    const session: CurrentSession = {
      user: { id, name: "Anna", email: "anna@example.com" },
      sessionId: randomUUID(),
      fresh: true,
    };
    return { id, cookie, session, headers: { cookie, origin: ORIGIN } };
  }

  async function signedIn(people: Awaited<ReturnType<typeof person>>[]) {
    clock = NINE_AM;
    return start({
      recall: store,
      sessions: Object.fromEntries(people.map((p) => [p.cookie, p.session])),
      content,
      now,
    });
  }

  const chapterCards = () =>
    content.chapters.find((c) => c.chapterId === "arrays-and-hashing")?.cards ??
    [];

  it("starts a chapter once and lists its cards as new", async () => {
    const me = await person();
    const api = await signedIn([me]);
    const first = await api.inject({
      method: "POST",
      url: START,
      headers: me.headers,
    });
    expect(first.json()).toEqual({ added: chapterCards().length });
    const again = await api.inject({
      method: "POST",
      url: START,
      headers: me.headers,
    });
    expect(again.json()).toEqual({ added: 0 });

    const due = await api.inject({
      url: "/v1/recall/due",
      headers: me.headers,
    });
    expect(due.headers["cache-control"]).toBe("no-store");
    expect(due.json()).toEqual({
      newLeftToday: 10,
      dueTomorrow: 0,
      overdue: 0,
      dayEndsAt: expect.any(String),
      chapters: [
        {
          trackId: "dsa",
          chapterId: "arrays-and-hashing",
          due: 0,
          new: chapterCards().length,
          offered: Math.min(10, chapterCards().length),
          learned: 0,
          total: chapterCards().length,
        },
      ],
    });
  });

  it("counts learned, tomorrow's, overdue, and missed cards", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({
      method: "PUT",
      url: "/v1/me/time-zone",
      headers: me.headers,
      payload: { timeZone: "America/Toronto" },
    });
    await api.inject({ method: "POST", url: START, headers: me.headers });
    const rate = async (cardId: string, rating: string) =>
      (
        await api.inject({
          method: "POST",
          url: "/v1/recall/reviews",
          headers: me.headers,
          payload: review({ cardId, rating, answeredAt: clock.toISOString() }),
        })
      ).json();
    const [first, second, third] = chapterCards();
    if (!first || !second || !third) throw new Error("chapter too short");

    await rate(first.id, "easy");
    await rate(second.id, "again");
    await rate(third.id, "good");
    clock = new Date(NINE_AM.getTime() + 10 * MINUTE);
    const graduated = await rate(third.id, "good");

    const session = (
      await api.inject({ url: "/v1/recall/session", headers: me.headers })
    ).json();
    const retryOf = (cardId: string) =>
      session.cards.find((c: { cardId: string }) => c.cardId === cardId)?.retry;
    expect(retryOf(second.id)).toBe(true);
    expect(
      session.cards.filter((c: { retry: boolean }) => c.retry),
    ).toHaveLength(1);

    const dueNow = async () =>
      (await api.inject({ url: "/v1/recall/due", headers: me.headers })).json();
    const today = await dueNow();
    expect(today.chapters[0].learned).toBe(2);
    expect(today.dueTomorrow).toBe(0);
    // The missed card is due, but not from before today
    expect(today.overdue).toBe(0);
    expect(today.dayEndsAt).toBe("2026-11-20T09:00:00.000Z");

    // A day later the missed card is overdue, and today ends at 4 a.m. Toronto time
    clock = new Date(NINE_AM.getTime() + DAY);
    const nextDay = await dueNow();
    expect(nextDay.overdue).toBe(1);
    expect(nextDay.dayEndsAt).toBe("2026-11-21T09:00:00.000Z");

    // From the day before it's due, the graduated card counts for tomorrow
    const due = new Date(graduated.dueAt);
    clock = new Date(due.getTime() - DAY);
    expect((await dueNow()).dueTomorrow).toBe(1);
    // Tomorrow's recall day ends at 4 a.m. Toronto time
    clock = new Date(due.getTime() - 2 * DAY);
    expect((await dueNow()).dueTomorrow).toBe(0);
  });

  it("offers ten new cards with the learning-step times", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({ method: "POST", url: START, headers: me.headers });
    const res = await api.inject({
      url: "/v1/recall/session",
      headers: me.headers,
    });
    const body = res.json();
    expect(body.newLeftToday).toBe(10);
    expect(body.cards).toHaveLength(10);
    // The chapter's own order
    expect(body.cards.map((c: { cardId: string }) => c.cardId)).toEqual(
      chapterCards()
        .slice(0, 10)
        .map((card) => card.id),
    );
    const minutes = (iso: string) =>
      (Date.parse(iso) - NINE_AM.getTime()) / MINUTE;
    const { next } = body.cards[0];
    expect(minutes(next.again)).toBe(1);
    expect(Math.round(minutes(next.hard))).toBe(6);
    expect(minutes(next.good)).toBe(10);
    expect(Math.round(minutes(next.easy) / (24 * 60))).toBe(54);
  });

  it("stores a retried review once and refuses a reused id", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({ method: "POST", url: START, headers: me.headers });
    const payload = review();
    const post = (body: object) =>
      api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers: me.headers,
        payload: body,
      });
    const first = await post(payload);
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({
      id: payload.id,
      dueAt: new Date(NINE_AM.getTime() + 10 * MINUTE).toISOString(),
      undoUntil: new Date(NINE_AM.getTime() + DAY).toISOString(),
    });
    const retry = await post(payload);
    expect(retry.json()).toEqual(first.json());
    const reused = await post({ ...payload, rating: "easy" });
    expect(reused.statusCode).toBe(422);
    expect(reused.json().code).toBe("review_id_reused");

    await api.inject({
      method: "POST",
      url: `/v1/recall/reviews/${payload.id}/undo`,
      headers: me.headers,
    });
    const undone = await post(payload);
    expect(undone.statusCode).toBe(409);
    expect(undone.json().code).toBe("review_undone");
  });

  it("answers as if another user's card and review don't exist", async () => {
    const me = await person();
    const other = await person();
    const api = await signedIn([me, other]);
    await api.inject({ method: "POST", url: START, headers: other.headers });
    const theirs = review();
    await api.inject({
      method: "POST",
      url: "/v1/recall/reviews",
      headers: other.headers,
      payload: theirs,
    });

    const mine = await api.inject({
      method: "POST",
      url: "/v1/recall/reviews",
      headers: me.headers,
      payload: review(),
    });
    expect(mine.statusCode).toBe(404);
    const undo = await api.inject({
      method: "POST",
      url: `/v1/recall/reviews/${theirs.id}/undo`,
      headers: me.headers,
    });
    expect(undo.statusCode).toBe(404);
    const due = await api.inject({
      url: "/v1/recall/due",
      headers: me.headers,
    });
    expect(due.json().chapters).toEqual([]);
  });

  it("undoes the latest rating within a day only", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({ method: "POST", url: START, headers: me.headers });
    const rate = (payload: object) =>
      api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers: me.headers,
        payload,
      });
    const undo = (id: string) =>
      api.inject({
        method: "POST",
        url: `/v1/recall/reviews/${id}/undo`,
        headers: me.headers,
      });

    const first = review();
    await rate(first);
    const undone = await undo(first.id);
    expect(undone.statusCode).toBe(200);
    expect(undone.json()).toEqual({
      trackId: "dsa",
      chapterId: "arrays-and-hashing",
      cardId: "array-operation-costs",
      dueAt: NINE_AM.toISOString(),
    });

    const older = review({ cardId: "why-insert-front-slow" });
    await rate(older);
    await rate(review({ cardId: "why-insert-front-slow" }));
    const notLatest = await undo(older.id);
    expect(notLatest.statusCode).toBe(409);
    expect(notLatest.json().code).toBe("not_latest_review");

    const slow = review();
    await rate(slow);
    clock = new Date(NINE_AM.getTime() + 11 * MINUTE);
    expect((await undo(slow.id)).statusCode).toBe(200);

    const late = review();
    await rate(late);
    clock = new Date(clock.getTime() + DAY + MINUTE);
    const expired = await undo(late.id);
    expect(expired.statusCode).toBe(409);
    expect(expired.json().code).toBe("undo_expired");
  });

  it("stops new cards after ten until 4 a.m. local time", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({
      method: "PUT",
      url: "/v1/me/time-zone",
      headers: me.headers,
      payload: { timeZone: "America/Toronto" },
    });
    await api.inject({ method: "POST", url: START, headers: me.headers });
    for (const card of chapterCards().slice(0, 10)) {
      await api.inject({
        method: "POST",
        url: "/v1/recall/reviews",
        headers: me.headers,
        payload: review({ cardId: card.id, rating: "easy" }),
      });
    }
    const session = async () =>
      (
        await api.inject({ url: "/v1/recall/session", headers: me.headers })
      ).json();

    expect(await session()).toEqual({ newLeftToday: 0, cards: [] });
    // 3:59 a.m. the next day still counts as today
    clock = new Date(NINE_AM.getTime() + DAY - 5 * 60 * MINUTE - MINUTE);
    expect((await session()).newLeftToday).toBe(0);
    clock = new Date(NINE_AM.getTime() + DAY - 5 * 60 * MINUTE);
    const morning = await session();
    expect(morning.newLeftToday).toBe(10);
    expect(morning.cards.length).toBeGreaterThan(0);
  });

  it("keeps the schedule when a card changes, and hides removed cards", async () => {
    const me = await person();
    const api = await signedIn([me]);
    await api.inject({ method: "POST", url: START, headers: me.headers });
    await api.inject({
      method: "POST",
      url: "/v1/recall/reviews",
      headers: me.headers,
      payload: review({ rating: "again" }),
    });
    await app?.close();

    // The same cards, with the first one edited and the last one removed
    const cards = chapterCards();
    const edited: ServedContent = {
      ...content,
      chapters: content.chapters.map((chapter) =>
        chapter.chapterId === "arrays-and-hashing"
          ? {
              ...chapter,
              cards: cards
                .slice(0, -1)
                .map((card) =>
                  card.id === "array-operation-costs"
                    ? { ...card, version: card.version + 1 }
                    : card,
                ),
            }
          : chapter,
      ),
    };
    clock = new Date(NINE_AM.getTime() + 2 * MINUTE);
    const api2 = await start({
      recall: store,
      sessions: { [me.cookie]: me.session },
      content: edited,
      now,
    });
    const body = (
      await api2.inject({ url: "/v1/recall/session", headers: me.headers })
    ).json();
    const changed = body.cards.find(
      (c: { cardId: string }) => c.cardId === "array-operation-costs",
    );
    const before = cards.find((card) => card.id === "array-operation-costs");
    expect(changed).toMatchObject({
      version: (before?.version ?? 0) + 1,
      isNew: false,
      dueAt: new Date(NINE_AM.getTime() + MINUTE).toISOString(),
    });
    const removed = cards.at(-1)?.id;
    const due = (
      await api2.inject({ url: "/v1/recall/due", headers: me.headers })
    ).json();
    expect(due.chapters[0].new).toBe(cards.length - 2);
    expect(
      body.cards.some((c: { cardId: string }) => c.cardId === removed),
    ).toBe(false);
  });

  it("saves a known time zone by its IANA name and refuses others", async () => {
    const me = await person();
    const api = await signedIn([me]);
    const put = (timeZone: string) =>
      api.inject({
        method: "PUT",
        url: "/v1/me/time-zone",
        headers: me.headers,
        payload: { timeZone },
      });
    expect((await put("Asia/Kolkata")).statusCode).toBe(204);
    expect(await store.timeZone(me.id)).toBe("Asia/Kolkata");
    const unknown = await put("Mars/Olympus_Mons");
    expect(unknown.statusCode).toBe(400);
    expect(unknown.json().code).toBe("unknown_time_zone");
    expect(await store.timeZone(me.id)).toBe("Asia/Kolkata");
  });

  describe("interview date", () => {
    async function setUp() {
      const me = await person();
      const targets: number[] = [];
      const spied: RecallStore = {
        ...store,
        review: (userId, input, at, target) => {
          targets.push(target ?? 0);
          return store.review(userId, input, at, target);
        },
      };
      clock = NINE_AM;
      const api = await start({
        recall: spied,
        sessions: { [me.cookie]: me.session },
        content,
        now,
      });
      const put = (date: unknown) =>
        api.inject({
          method: "PUT",
          url: "/v1/me/interview-date",
          headers: me.headers,
          payload: { date },
        });
      const get = async () =>
        (
          await api.inject({
            method: "GET",
            url: "/v1/me/interview-date",
            headers: me.headers,
          })
        ).json();
      return { me, api, put, get, targets };
    }

    it("starts with no date and the usual target", async () => {
      const { get } = await setUp();
      expect(await get()).toEqual({
        date: null,
        startsOn: null,
        status: "none",
        target: 0.9,
      });
    });

    it("aims higher from 28 days before through the day itself", async () => {
      const { put, get } = await setUp();
      // NINE_AM is November 19 in UTC
      const on = await put("2026-12-17");
      expect(on.statusCode).toBe(200);
      expect(on.json()).toEqual({
        date: "2026-12-17",
        startsOn: "2026-11-19",
        status: "on",
        target: 0.95,
      });
      expect((await put("2026-12-18")).json()).toMatchObject({
        startsOn: "2026-11-20",
        status: "later",
        target: 0.9,
      });
      expect((await put("2026-11-19")).json().target).toBe(0.95);
      clock = new Date(NINE_AM.getTime() + DAY);
      expect(await get()).toMatchObject({ status: "passed", target: 0.9 });
    });

    it("refuses a past date or something that isn't a date", async () => {
      const { put, get } = await setUp();
      const past = await put("2026-11-18");
      expect(past.statusCode).toBe(400);
      expect(past.json().code).toBe("interview_date_passed");
      const notReal = await put("2026-02-30");
      expect(notReal.statusCode).toBe(400);
      expect(notReal.json().code).toBe("not_a_date");
      for (const bad of [
        "tomorrow",
        "2026-12-14T00:00",
        20261214,
        {},
        ...SQL_ATTACKS,
      ]) {
        expect((await put(bad)).statusCode).toBe(400);
      }
      expect((await get()).date).toBeNull();
    });

    it("clears the date with null", async () => {
      const { put } = await setUp();
      await put("2026-12-14");
      expect((await put(null)).json()).toMatchObject({
        date: null,
        status: "none",
        target: 0.9,
      });
    });

    it("reviews with the target that applies today", async () => {
      const { me, api, put, targets } = await setUp();
      await api.inject({ method: "POST", url: START, headers: me.headers });
      const rate = () =>
        api.inject({
          method: "POST",
          url: "/v1/recall/reviews",
          headers: me.headers,
          payload: review({ answeredAt: clock.toISOString() }),
        });
      expect((await rate()).statusCode).toBe(200);
      await put("2026-12-01");
      expect((await rate()).statusCode).toBe(200);
      await put(null);
      expect((await rate()).statusCode).toBe(200);
      expect(targets).toEqual([0.9, 0.95, 0.9]);
    });
  });

  it("limits how often each user can call a route", async () => {
    const me = await person();
    const other = await person();
    const api = await signedIn([me, other]);
    const startChapter = (headers: Record<string, string>) =>
      api.inject({ method: "POST", url: START, headers });
    for (let i = 0; i < RECALL_LIMITS.starts; i++) {
      expect((await startChapter(me.headers)).statusCode).toBe(200);
    }
    const limited = await startChapter(me.headers);
    expect(limited.statusCode).toBe(429);
    expect(limited.json().code).toBe("rate_limited");
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
    // Each user has their own count
    expect((await startChapter(other.headers)).statusCode).toBe(200);
  });
});
