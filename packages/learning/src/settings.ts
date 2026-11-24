export type CodeLanguage = "typescript" | "python";

export interface RehearsalMinutes {
  designReview: number;
  classDesign: number;
  storyAnswer: number;
}

/** Every study setting a learner can change, with no gaps */
export interface LearnerSettings {
  newCardsPerDay: number;
  /** New cards a day for one track, taken out of newCardsPerDay. A missing track has no limit of its own. */
  trackNewLimits: Record<string, number>;
  /** Null means no cap */
  reviewsPerDay: number | null;
  /** Whole percents, like 90 */
  recallTarget: number;
  interviewTarget: number;
  interviewWeeks: number;
  /** The hour each recall day starts, from 0 to 23 */
  dayStartsAt: number;
  /** When false, the time zone stays as picked and the apps stop sending theirs */
  followDeviceTimeZone: boolean;
  rehearsalMinutes: RehearsalMinutes;
  codeLanguage: CodeLanguage;
}

/** What a learner gets before changing anything, and what Reset all puts back */
export const SUGGESTED_SETTINGS: LearnerSettings = Object.freeze({
  newCardsPerDay: 10,
  trackNewLimits: Object.freeze({}) as Record<string, number>,
  reviewsPerDay: null,
  recallTarget: 90,
  interviewTarget: 95,
  interviewWeeks: 4,
  dayStartsAt: 4,
  followDeviceTimeZone: true,
  rehearsalMinutes: Object.freeze({
    designReview: 45,
    classDesign: 45,
    storyAnswer: 5,
  }),
  codeLanguage: "typescript",
});

/** Anki warns outside this band, since reviews climb fast above it and forgetting adds work below it */
export const RECALL_TARGET_NOTE_BAND = { low: 80, high: 95 } as const;

export const SETTING_LIMITS = {
  newCardsPerDay: { min: 0, max: 50 },
  trackNewLimit: { min: 0, max: 50 },
  reviewsPerDay: { min: 50, max: 500 },
  recallTarget: { min: 70, max: 97 },
  interviewTarget: { max: 97 },
  interviewWeeks: { min: 1, max: 8 },
  dayStartsAt: { min: 0, max: 23 },
  designReview: { min: 15, max: 90 },
  classDesign: { min: 15, max: 90 },
  storyAnswer: { min: 1, max: 10 },
} as const;

export const CODE_LANGUAGE_NAMES: readonly CodeLanguage[] = [
  "typescript",
  "python",
];

/** A setting's path, like "recallTarget" or "rehearsalMinutes.storyAnswer" */
export type SettingField = string;

export interface SettingProblem {
  field: SettingField;
  message: string;
}

const whole = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

function range(
  problems: SettingProblem[],
  field: SettingField,
  value: unknown,
  min: number,
  max: number,
  message: string,
) {
  if (!whole(value) || value < min || value > max) {
    problems.push({ field, message });
  }
}

/** Everything wrong with a full set of settings, worded for the learner */
export function checkSettings(settings: LearnerSettings): SettingProblem[] {
  const problems: SettingProblem[] = [];
  const L = SETTING_LIMITS;
  range(
    problems,
    // biome-ignore lint/security/noSecrets: a setting name, not a secret
    "newCardsPerDay",
    settings.newCardsPerDay,
    L.newCardsPerDay.min,
    L.newCardsPerDay.max,
    "Pick a number from 0 to 50.",
  );
  for (const [track, limit] of Object.entries(settings.trackNewLimits)) {
    range(
      problems,
      `trackNewLimits.${track}`,
      limit,
      L.trackNewLimit.min,
      L.trackNewLimit.max,
      "Pick a number from 0 to 50, or leave it empty for no limit.",
    );
  }
  if (settings.reviewsPerDay !== null) {
    range(
      problems,
      "reviewsPerDay",
      settings.reviewsPerDay,
      L.reviewsPerDay.min,
      L.reviewsPerDay.max,
      "Pick a number from 50 to 500, or remove the cap.",
    );
  }
  range(
    problems,
    "recallTarget",
    settings.recallTarget,
    L.recallTarget.min,
    L.recallTarget.max,
    "Pick from 70% to 97%. Above 97%, reviews pile up fast.",
  );
  // Measured against the everyday target only once that one is in range, so one mistake gets one message
  const everyday = problems.some((p) => p.field === "recallTarget")
    ? L.recallTarget.min
    : settings.recallTarget;
  range(
    problems,
    "interviewTarget",
    settings.interviewTarget,
    everyday,
    L.interviewTarget.max,
    `Pick from your everyday target, ${everyday}%, to 97%.`,
  );
  range(
    problems,
    "interviewWeeks",
    settings.interviewWeeks,
    L.interviewWeeks.min,
    L.interviewWeeks.max,
    "Pick a number from 1 to 8.",
  );
  range(
    problems,
    "dayStartsAt",
    settings.dayStartsAt,
    L.dayStartsAt.min,
    L.dayStartsAt.max,
    "Pick an hour from the list.",
  );
  range(
    problems,
    "rehearsalMinutes.designReview",
    settings.rehearsalMinutes.designReview,
    L.designReview.min,
    L.designReview.max,
    "Pick from 15 to 90 minutes.",
  );
  range(
    problems,
    "rehearsalMinutes.classDesign",
    settings.rehearsalMinutes.classDesign,
    L.classDesign.min,
    L.classDesign.max,
    "Pick from 15 to 90 minutes.",
  );
  range(
    problems,
    "rehearsalMinutes.storyAnswer",
    settings.rehearsalMinutes.storyAnswer,
    L.storyAnswer.min,
    L.storyAnswer.max,
    "Pick from 1 to 10 minutes.",
  );
  if (!CODE_LANGUAGE_NAMES.includes(settings.codeLanguage)) {
    problems.push({ field: "codeLanguage", message: "Pick a language." });
  }
  return problems;
}

/** The recall target as the scheduler takes it, from a whole percent */
export const targetFraction = (percent: number) => percent / 100;

/** About how many reviews a day a steady new-card rate settles into, from Anki's 20 new giving about 200 */
export const settledReviewsPerDay = (newCardsPerDay: number) =>
  newCardsPerDay * 10;
