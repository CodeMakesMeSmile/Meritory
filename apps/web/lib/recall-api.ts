import type {
  InterviewDateResponse,
  RecallDueResponse,
  RecallRating,
  RecallSessionResponse,
  RecordReviewResponse,
  StartChapterResponse,
  UndoReviewResponse,
} from "@meritory/contracts";

export type { RecallRating, RecallSessionResponse };
export type RecallSessionCard = RecallSessionResponse["cards"][number];

/** What a recall request came back with, in terms the page acts on */
export type RecallResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "signed_out" | "failed"; code?: string };

/** The API's own error code, such as undo_expired, when the body has one */
async function errorCode(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    const code = (body as { code?: unknown } | null)?.code;
    return typeof code === "string" ? code : undefined;
  } catch {
    return undefined;
  }
}

const BASE = "/api/v1";

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<RecallResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (res.status === 401) return { ok: false, reason: "signed_out" };
  if (!res.ok)
    return { ok: false, reason: "failed", code: await errorCode(res) };
  const data = res.status === 204 ? undefined : await res.json();
  return { ok: true, data: data as T };
}

const json = (body: unknown): RequestInit => ({
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export function loadSession() {
  return call<RecallSessionResponse>("/recall/session");
}

export function loadDue() {
  return call<RecallDueResponse>("/recall/due");
}

export function startChapter(trackId: string, chapterId: string) {
  const path = `/recall/tracks/${encodeURIComponent(trackId)}/chapters/${encodeURIComponent(chapterId)}/start`;
  return call<StartChapterResponse>(path, { method: "POST" });
}

export interface ReviewToSave {
  /** Made once per answer, so Save again can't count it twice */
  id: string;
  card: RecallSessionCard;
  rating: RecallRating;
  answeredAt: Date;
  durationMs: number;
}

/** The review code from RECALL_ERRORS, kept here so pages don't load the API schemas */
export const REVIEW_ERRORS = { undone: "review_undone" } as const;

/** The saved rating, or null when a retry finds it was undone, so it no longer counts */
export async function saveReview(
  review: ReviewToSave,
): Promise<RecallResult<RecordReviewResponse | null>> {
  const result = await call<RecordReviewResponse>("/recall/reviews", {
    method: "POST",
    ...json({
      id: review.id,
      trackId: review.card.trackId,
      chapterId: review.card.chapterId,
      cardId: review.card.cardId,
      cardVersion: review.card.version,
      rating: review.rating,
      answeredAt: review.answeredAt.toISOString(),
      durationMs: Math.max(0, Math.round(review.durationMs)),
    }),
  });
  if (!result.ok && result.code === REVIEW_ERRORS.undone) {
    return { ok: true, data: null };
  }
  return result;
}

export function undoReview(id: string) {
  return call<UndoReviewResponse>(
    `/recall/reviews/${encodeURIComponent(id)}/undo`,
    { method: "POST" },
  );
}

export function saveTimeZone(timeZone: string) {
  return call<undefined>("/me/time-zone", {
    method: "PUT",
    ...json({ timeZone }),
  });
}

/** The interview date codes from RECALL_ERRORS, kept here so pages don't load the API schemas */
export const INTERVIEW_ERRORS = {
  notADate: "not_a_date",
  datePassed: "interview_date_passed",
} as const;

export function saveInterviewDate(date: string | null) {
  return call<InterviewDateResponse>("/me/interview-date", {
    method: "PUT",
    ...json({ date }),
  });
}
