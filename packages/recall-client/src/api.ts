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
  | {
      ok: false;
      reason: "signed_out" | "failed";
      code?: string;
      /** The API turned it down for good, so sending it again gets the same answer */
      refused?: boolean;
    };

export interface RecallApiOptions {
  /** Where the API answers, the same origin's /api/v1 unless given */
  baseUrl?: string;
  /** Headers for every request, such as the phone's session cookie */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  /** The phone sends its cookie itself, so it passes "omit" */
  credentials?: RequestInit["credentials"];
}

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

/** The longest time on one card the API accepts, which a card left open overnight can pass */
export const MAX_DURATION_MS = 86_400_000;

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

/** The interview date codes from RECALL_ERRORS, kept here so pages don't load the API schemas */
export const INTERVIEW_ERRORS = {
  notADate: "not_a_date",
  datePassed: "interview_date_passed",
} as const;

const DEFAULT_BASE = "/api/v1";

export function createRecallApi(options: RecallApiOptions = {}) {
  const base = options.baseUrl ?? DEFAULT_BASE;

  async function call<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<RecallResult<T>> {
    let res: Response;
    try {
      const extra = options.headers ? await options.headers() : {};
      res = await fetch(`${base}${path}`, {
        cache: "no-store",
        ...(options.credentials ? { credentials: options.credentials } : {}),
        ...init,
        headers: { ...extra, ...(init.headers as Record<string, string>) },
      });
    } catch {
      return { ok: false, reason: "failed" };
    }
    if (res.status === 401) return { ok: false, reason: "signed_out" };
    if (!res.ok) {
      // A timeout or a rate limit can pass on a later try
      const refused =
        res.status >= 400 &&
        res.status < 500 &&
        res.status !== 408 &&
        res.status !== 429;
      return {
        ok: false,
        reason: "failed",
        code: await errorCode(res),
        ...(refused ? { refused } : {}),
      };
    }
    const data = res.status === 204 ? undefined : await res.json();
    return { ok: true, data: data as T };
  }

  const json = (body: unknown): RequestInit => ({
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    loadSession() {
      return call<RecallSessionResponse>("/recall/session");
    },

    loadDue() {
      return call<RecallDueResponse>("/recall/due");
    },

    startChapter(trackId: string, chapterId: string) {
      const path = `/recall/tracks/${encodeURIComponent(trackId)}/chapters/${encodeURIComponent(chapterId)}/start`;
      return call<StartChapterResponse>(path, { method: "POST" });
    },

    /** The saved rating, or null when a retry finds it was undone, so it no longer counts */
    async saveReview(
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
          durationMs: Math.min(
            MAX_DURATION_MS,
            Math.max(0, Math.round(review.durationMs)),
          ),
        }),
      });
      if (!result.ok && result.code === REVIEW_ERRORS.undone) {
        return { ok: true, data: null };
      }
      return result;
    },

    undoReview(id: string) {
      return call<UndoReviewResponse>(
        `/recall/reviews/${encodeURIComponent(id)}/undo`,
        { method: "POST" },
      );
    },

    saveTimeZone(timeZone: string) {
      return call<undefined>("/me/time-zone", {
        method: "PUT",
        ...json({ timeZone }),
      });
    },

    loadInterviewDate() {
      return call<InterviewDateResponse>("/me/interview-date");
    },

    saveInterviewDate(date: string | null) {
      return call<InterviewDateResponse>("/me/interview-date", {
        method: "PUT",
        ...json({ date }),
      });
    },
  };
}

export type RecallApi = ReturnType<typeof createRecallApi>;
