import type { InterviewDateResponse } from "@meritory/contracts";
import {
  interviewStatus,
  interviewWindowStart,
  type QueueLimits,
  recallDate,
  recallDayStart,
  recallTargetFor,
  trackNewLeft,
} from "@meritory/learning";
import type { RecallStore, StoredSettings } from "@meritory/server";

/** The interview date as the learner sees it, and today's recall target */
export function interviewAnswer(stored: StoredSettings, now: Date) {
  const { learner, timeZone, interviewDate } = stored;
  const day = recallDate(now, timeZone, learner.dayStartsAt);
  const weeks = learner.interviewWeeks;
  return {
    day,
    answer: {
      date: interviewDate,
      startsOn: interviewDate
        ? interviewWindowStart(interviewDate, weeks)
        : null,
      status: interviewStatus(interviewDate, day, weeks),
      target: recallTargetFor(interviewDate, day, learner),
    } satisfies InterviewDateResponse,
  };
}

/** Today's recall day for the learner, with what is left of each allowance */
export async function learnerDay(
  store: RecallStore,
  userId: string,
  now: Date,
) {
  const stored = await store.settings(userId);
  const { learner, timeZone } = stored;
  const start = recallDayStart(now, timeZone, learner.dayStartsAt);
  const seen = await store.newSeenSince(userId, start);
  const reviewsLeft =
    learner.reviewsPerDay === null
      ? null
      : Math.max(
          0,
          learner.reviewsPerDay - (await store.reviewsSince(userId, start)),
        );
  const limits: QueueLimits = {
    newLeft: Math.max(0, learner.newCardsPerDay - seen.total),
    trackNewLeft: trackNewLeft(learner.trackNewLimits, seen.byTrack),
    reviewsLeft,
  };
  return { stored, start, limits };
}
