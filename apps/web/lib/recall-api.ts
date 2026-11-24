import { createRecallApi } from "@meritory/recall-client";

export type {
  RecallRating,
  RecallSessionCard,
  RecallSessionResponse,
  ReviewToSave,
  SettingProblem,
  SettingsBody,
  SettingsResponse,
} from "@meritory/recall-client";

// The browser calls its own origin and sends the session cookie itself
export const {
  loadSession,
  loadDue,
  startChapter,
  saveReview,
  undoReview,
  saveTimeZone,
  loadSettings,
  saveSettings,
  resetSettings,
} = createRecallApi();
