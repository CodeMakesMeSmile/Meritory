import { createRecallApi } from "@meritory/recall-client";

export {
  INTERVIEW_ERRORS,
  type RecallRating,
  type RecallSessionCard,
  type RecallSessionResponse,
  type ReviewToSave,
} from "@meritory/recall-client";

// The browser calls its own origin and sends the session cookie itself
export const {
  loadSession,
  loadDue,
  startChapter,
  saveReview,
  undoReview,
  saveTimeZone,
  saveInterviewDate,
} = createRecallApi();
