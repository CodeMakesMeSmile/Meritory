import { ID_PATTERN } from "@meritory/content";
import Type, { type Static } from "typebox";

const UUID = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

const ContentId = Type.String({ pattern: ID_PATTERN, maxLength: 80 });
const Time = Type.String({ format: "date-time" });
const Count = Type.Integer({ minimum: 0 });

export const RecallRating = Type.Union([
  Type.Literal("again"),
  Type.Literal("hard"),
  Type.Literal("good"),
  Type.Literal("easy"),
]);
export type RecallRating = Static<typeof RecallRating>;

export const ChapterParams = Type.Object({
  trackId: ContentId,
  chapterId: ContentId,
});
export type ChapterParams = Static<typeof ChapterParams>;

export const StartChapterResponse = Type.Object(
  { added: Count },
  { $id: "StartChapterResponse" },
);
export type StartChapterResponse = Static<typeof StartChapterResponse>;

export const RecallDueResponse = Type.Object(
  {
    /** New cards still allowed before 4 a.m. local time */
    newLeftToday: Count,
    /** Cards that come due during tomorrow's recall day */
    dueTomorrow: Count,
    /** Due cards that were already due before today's recall day began */
    overdue: Count,
    /** When today's recall day ends, at 4 a.m. local time */
    dayEndsAt: Time,
    chapters: Type.Array(
      Type.Object({
        trackId: Type.String(),
        chapterId: Type.String(),
        due: Count,
        new: Count,
        /** Cards that have left their learning steps */
        learned: Count,
        /** Every card the chapter has */
        total: Count,
      }),
    ),
  },
  { $id: "RecallDueResponse" },
);
export type RecallDueResponse = Static<typeof RecallDueResponse>;

export const RecallSessionCard = Type.Object({
  trackId: Type.String(),
  chapterId: Type.String(),
  cardId: Type.String(),
  /** The bundle's current version, which may be newer than the one last shown */
  version: Type.Integer({ minimum: 1 }),
  isNew: Type.Boolean(),
  /** The latest rating was Missed, so the card is asked in other words */
  retry: Type.Boolean(),
  dueAt: Time,
  /** When each rating would bring the card back, for the rating buttons */
  next: Type.Object({ again: Time, hard: Time, good: Time, easy: Time }),
});
export type RecallSessionCard = Static<typeof RecallSessionCard>;

export const RecallSessionResponse = Type.Object(
  { newLeftToday: Count, cards: Type.Array(RecallSessionCard) },
  { $id: "RecallSessionResponse" },
);
export type RecallSessionResponse = Static<typeof RecallSessionResponse>;

export const RecordReviewBody = Type.Object(
  {
    /** A UUID the app makes, so a retry is stored once */
    id: Type.String({ pattern: UUID }),
    trackId: ContentId,
    chapterId: ContentId,
    cardId: ContentId,
    cardVersion: Type.Integer({ minimum: 1, maximum: 1_000_000 }),
    rating: RecallRating,
    answeredAt: Time,
    /** Time spent on the card, stored as at most 10 minutes */
    durationMs: Type.Optional(
      Type.Integer({ minimum: 0, maximum: 86_400_000 }),
    ),
  },
  { additionalProperties: false },
);
export type RecordReviewBody = Static<typeof RecordReviewBody>;

export const RecordReviewResponse = Type.Object(
  { id: Type.String(), dueAt: Time, undoUntil: Time },
  { $id: "RecordReviewResponse" },
);
export type RecordReviewResponse = Static<typeof RecordReviewResponse>;

export const ReviewParams = Type.Object({ id: Type.String({ pattern: UUID }) });
export type ReviewParams = Static<typeof ReviewParams>;

export const UndoReviewResponse = Type.Object(
  {
    trackId: Type.String(),
    chapterId: Type.String(),
    cardId: Type.String(),
    dueAt: Time,
  },
  { $id: "UndoReviewResponse" },
);
export type UndoReviewResponse = Static<typeof UndoReviewResponse>;

export const TimeZoneBody = Type.Object(
  {
    timeZone: Type.String({
      maxLength: 64,
      pattern: "^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+){0,2}$",
      examples: ["America/Toronto"],
    }),
  },
  { additionalProperties: false },
);
export type TimeZoneBody = Static<typeof TimeZoneBody>;

const CalendarDate = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
  examples: ["2026-12-14"],
});

export const InterviewDateBody = Type.Object(
  { date: Type.Union([CalendarDate, Type.Null()]) },
  { additionalProperties: false },
);
export type InterviewDateBody = Static<typeof InterviewDateBody>;

export const InterviewDateResponse = Type.Object(
  {
    date: Type.Union([CalendarDate, Type.Null()]),
    /** The first day of the higher recall target, when a date is set */
    startsOn: Type.Union([CalendarDate, Type.Null()]),
    status: Type.Union([
      Type.Literal("none"),
      Type.Literal("later"),
      Type.Literal("on"),
      Type.Literal("passed"),
    ]),
    /** The recall target used today */
    target: Type.Number(),
  },
  { $id: "InterviewDateResponse" },
);
export type InterviewDateResponse = Static<typeof InterviewDateResponse>;

/** Error codes the recall routes answer with */
export const RECALL_ERRORS = {
  idReused: "review_id_reused",
  notLatest: "not_latest_review",
  undoExpired: "undo_expired",
  unknownTimeZone: "unknown_time_zone",
  notADate: "not_a_date",
  datePassed: "interview_date_passed",
} as const;
