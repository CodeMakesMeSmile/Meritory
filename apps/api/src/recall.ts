import rateLimit from "@fastify/rate-limit";
import {
  ChapterParams,
  type ErrorResponse,
  RECALL_ERRORS,
  RecallDueResponse,
  RecallSessionResponse,
  RecordReviewBody,
  RecordReviewResponse,
  ReviewParams,
  StartChapterResponse,
  TimeZoneBody,
  UndoReviewResponse,
} from "@meritory/contracts";
import {
  buildRecallQueue,
  isKnownTimeZone,
  isLearned,
  NEW_CARDS_PER_DAY,
  nextDueDates,
  nextRecallDayStart,
  recallDayStart,
} from "@meritory/learning";
import type { RecallStore, StoredRecallCard } from "@meritory/server";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ServedChapter } from "./content.ts";
import type { CurrentSession } from "./session.ts";

/** The most cards one session answer holds, so a long gap can't make it huge */
export const SESSION_LIMIT = 100;

/** Requests each user may make in a minute */
export const RECALL_LIMITS = {
  reviews: 120,
  reads: 60,
  starts: 10,
  timeZone: 10,
} as const;

/** Bodies here are a few hundred bytes at most */
const BODY_LIMIT = 1024;

export interface RecallDependencies {
  store: RecallStore;
  chapters: ServedChapter[];
  /** The server's clock, which tests replace */
  now: () => Date;
}

function refuse(reply: FastifyReply, status: number, body: ErrorResponse) {
  return reply.code(status).send(body);
}

const chapterKey = (trackId: string, chapterId: string) =>
  `${trackId}/${chapterId}`;

const perMinute = (max: number, groupId: string) => ({
  rateLimit: { max, timeWindow: "1 minute", groupId },
});

/** Cards still in the bundle, with the chapter's place in it and the card's current version */
function liveCards(stored: StoredRecallCard[], chapters: ServedChapter[]) {
  const order = new Map<string, number>();
  const versions = new Map<string, number>();
  chapters.forEach((chapter, index) => {
    const key = chapterKey(chapter.trackId, chapter.chapterId);
    order.set(key, index);
    for (const card of chapter.cards) {
      versions.set(`${key}/${card.id}`, card.version);
    }
  });
  return stored
    .flatMap((row) => {
      const key = chapterKey(row.trackId, row.chapterId);
      const version = versions.get(`${key}/${row.cardId}`);
      const chapterOrder = order.get(key);
      if (version === undefined || chapterOrder === undefined) return [];
      return [{ ...row, version, chapterOrder }];
    })
    .sort(
      (a, b) =>
        a.addedAt.getTime() - b.addedAt.getTime() ||
        a.chapterOrder - b.chapterOrder ||
        a.position - b.position,
    );
}

export async function registerRecallRoutes(
  scope: FastifyInstance,
  deps: RecallDependencies,
) {
  await scope.register(rateLimit, {
    global: false,
    // After the session check, so each user has their own count
    hook: "preHandler",
    keyGenerator: (request) => request.user?.id ?? request.ip,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      message: `Too many requests. Try again in ${context.after}.`,
    }),
  });

  const findChapter = (trackId: string, chapterId: string) =>
    deps.chapters.find(
      (chapter) =>
        chapter.trackId === trackId && chapter.chapterId === chapterId,
    );

  /** Today's start in the learner's time zone, and how many new cards are left */
  async function today(userId: string, now: Date) {
    const timeZone = await deps.store.timeZone(userId);
    const start = recallDayStart(now, timeZone);
    const seen = await deps.store.newSeenSince(userId, start);
    return {
      timeZone,
      start,
      newLeft: Math.max(0, NEW_CARDS_PER_DAY - seen),
    };
  }

  scope.post<{ Params: ChapterParams }>(
    "/recall/tracks/:trackId/chapters/:chapterId/start",
    {
      schema: {
        summary: "Add a chapter's cards to recall",
        tags: ["recall"],
        params: ChapterParams,
        response: { 200: StartChapterResponse },
      },
      config: perMinute(RECALL_LIMITS.starts, "recall-starts"),
    },
    async (request, reply) => {
      const { user } = request.current as CurrentSession;
      const chapter = findChapter(
        request.params.trackId,
        request.params.chapterId,
      );
      if (!chapter) {
        return refuse(reply, 404, {
          code: "not_found",
          message: "That chapter doesn't exist.",
        });
      }
      const added = await deps.store.start(user.id, chapter, deps.now());
      return { added };
    },
  );

  scope.get(
    "/recall/due",
    {
      schema: {
        summary: "Due and new cards for each started chapter",
        tags: ["recall"],
        response: { 200: RecallDueResponse },
      },
      config: perMinute(RECALL_LIMITS.reads, "recall-reads"),
    },
    async (request) => {
      const { user } = request.current as CurrentSession;
      const now = deps.now();
      const day = await today(user.id, now);
      const tomorrow = nextRecallDayStart(day.start, day.timeZone);
      const dayAfter = nextRecallDayStart(tomorrow, day.timeZone);
      const cards = liveCards(await deps.store.cards(user.id), deps.chapters);
      const counts = new Map<
        string,
        {
          trackId: string;
          chapterId: string;
          due: number;
          new: number;
          learned: number;
          total: number;
        }
      >();
      for (const chapter of deps.chapters) {
        counts.set(chapterKey(chapter.trackId, chapter.chapterId), {
          trackId: chapter.trackId,
          chapterId: chapter.chapterId,
          due: 0,
          new: 0,
          learned: 0,
          total: chapter.cards.length,
        });
      }
      const started = new Set<string>();
      let dueTomorrow = 0;
      let overdue = 0;
      for (const { trackId, chapterId, card } of cards) {
        const key = chapterKey(trackId, chapterId);
        const count = counts.get(key);
        if (!count) continue;
        started.add(key);
        if (isLearned(card)) count.learned += 1;
        const due = card.dueAt.getTime();
        if (card.scheduleStatus === "new") count.new += 1;
        else if (due <= now.getTime()) {
          count.due += 1;
          if (due < day.start.getTime()) overdue += 1;
        }
        if (
          card.scheduleStatus !== "new" &&
          due >= tomorrow.getTime() &&
          due < dayAfter.getTime()
        ) {
          dueTomorrow += 1;
        }
      }
      return {
        newLeftToday: day.newLeft,
        dueTomorrow,
        overdue,
        dayEndsAt: tomorrow.toISOString(),
        chapters: [...counts]
          .filter(([key]) => started.has(key))
          .map(([, count]) => count),
      };
    },
  );

  scope.get(
    "/recall/session",
    {
      schema: {
        summary: "The cards to recall now, due cards first",
        tags: ["recall"],
        response: { 200: RecallSessionResponse },
      },
      config: perMinute(RECALL_LIMITS.reads, "recall-reads"),
    },
    async (request) => {
      const { user } = request.current as CurrentSession;
      const now = deps.now();
      const left = (await today(user.id, now)).newLeft;
      const cards = liveCards(await deps.store.cards(user.id), deps.chapters);
      const queue = buildRecallQueue(
        cards.map((stored) => ({
          dueAt: stored.card.dueAt,
          scheduleStatus: stored.card.scheduleStatus,
          stored,
        })),
        now,
        NEW_CARDS_PER_DAY - left,
      ).slice(0, SESSION_LIMIT);
      return {
        newLeftToday: left,
        cards: queue.map(({ stored }) => {
          const next = nextDueDates(stored.card, now);
          return {
            trackId: stored.trackId,
            chapterId: stored.chapterId,
            cardId: stored.cardId,
            version: stored.version,
            isNew: stored.card.scheduleStatus === "new",
            retry: stored.lastMissed,
            dueAt: stored.card.dueAt.toISOString(),
            next: {
              again: next.again.toISOString(),
              hard: next.hard.toISOString(),
              good: next.good.toISOString(),
              easy: next.easy.toISOString(),
            },
          };
        }),
      };
    },
  );

  scope.post<{ Body: RecordReviewBody }>(
    "/recall/reviews",
    {
      bodyLimit: BODY_LIMIT,
      schema: {
        summary: "Record a rating. A retry with the same id is stored once.",
        tags: ["recall"],
        body: RecordReviewBody,
        response: { 200: RecordReviewResponse },
      },
      config: perMinute(RECALL_LIMITS.reviews, "recall-reviews"),
    },
    async (request, reply) => {
      const { user } = request.current as CurrentSession;
      const body = request.body;
      const current = findChapter(body.trackId, body.chapterId)?.cards.find(
        (card) => card.id === body.cardId,
      );
      if (!current || body.cardVersion > current.version) {
        return refuse(reply, 404, {
          code: "not_found",
          message: "That card doesn't exist.",
        });
      }
      const result = await deps.store.review(
        user.id,
        {
          id: body.id,
          trackId: body.trackId,
          chapterId: body.chapterId,
          cardId: body.cardId,
          cardVersion: body.cardVersion,
          rating: body.rating,
          answeredAt: new Date(body.answeredAt),
          durationMs: body.durationMs ?? null,
        },
        deps.now(),
      );
      if (result.kind === "not_found") {
        return refuse(reply, 404, {
          code: "not_found",
          message: "Start recall on this card's chapter first.",
        });
      }
      if (result.kind === "id_reused") {
        return refuse(reply, 422, {
          code: RECALL_ERRORS.idReused,
          message: "That review id was already used for a different answer.",
        });
      }
      return {
        id: result.review.id,
        dueAt: result.review.dueAt.toISOString(),
        undoUntil: result.review.undoUntil.toISOString(),
      };
    },
  );

  scope.post<{ Params: ReviewParams }>(
    "/recall/reviews/:id/undo",
    {
      schema: {
        summary: "Undo a card's latest rating, within a day",
        tags: ["recall"],
        params: ReviewParams,
        response: { 200: UndoReviewResponse },
      },
      config: perMinute(RECALL_LIMITS.reviews, "recall-reviews"),
    },
    async (request, reply) => {
      const { user } = request.current as CurrentSession;
      const result = await deps.store.undo(
        user.id,
        request.params.id,
        deps.now(),
      );
      if (result.kind === "not_found") {
        return refuse(reply, 404, {
          code: "not_found",
          message: "That rating doesn't exist.",
        });
      }
      if (result.kind === "not_latest") {
        return refuse(reply, 409, {
          code: RECALL_ERRORS.notLatest,
          message: "Only the card's latest rating can be undone.",
        });
      }
      if (result.kind === "too_late") {
        return refuse(reply, 409, {
          code: RECALL_ERRORS.undoExpired,
          message: "A rating can only be undone for a day.",
        });
      }
      return { ...result.card, dueAt: result.card.dueAt.toISOString() };
    },
  );

  scope.put<{ Body: TimeZoneBody }>(
    "/me/time-zone",
    {
      bodyLimit: BODY_LIMIT,
      schema: {
        summary: "Set the time zone each recall day starts in",
        tags: ["account"],
        body: TimeZoneBody,
      },
      config: perMinute(RECALL_LIMITS.timeZone, "time-zone"),
    },
    async (request, reply) => {
      const { user } = request.current as CurrentSession;
      const { timeZone } = request.body;
      if (!isKnownTimeZone(timeZone)) {
        return refuse(reply, 400, {
          code: RECALL_ERRORS.unknownTimeZone,
          message: "That time zone isn't one we know.",
        });
      }
      await deps.store.setTimeZone(user.id, timeZone);
      return reply.code(204).send();
    },
  );
}
