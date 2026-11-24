import { ID_PATTERN } from "@meritory/content";
import Type, { type Static } from "typebox";
import { CalendarDate, InterviewDateResponse, TimeZoneName } from "./recall.ts";

// Loose bounds here, so the route can answer out-of-range values in the learner's words
const Whole = Type.Integer({ minimum: 0, maximum: 1000 });

const TrackLimits = Type.Record(
  Type.String({ pattern: ID_PATTERN, maxLength: 80 }),
  Whole,
  { maxProperties: 20, additionalProperties: false },
);

const Language = Type.Union([
  Type.Literal("typescript"),
  Type.Literal("python"),
]);

const RehearsalMinutes = Type.Object(
  { designReview: Whole, classDesign: Whole, storyAnswer: Whole },
  { additionalProperties: false },
);

export const LearnerSettingsValues = Type.Object(
  {
    newCardsPerDay: Whole,
    /** New cards a day for one track, out of newCardsPerDay. A missing track has no limit of its own. */
    trackNewLimits: TrackLimits,
    /** Null means no cap */
    reviewsPerDay: Type.Union([Whole, Type.Null()]),
    /** Whole percents */
    recallTarget: Whole,
    interviewTarget: Whole,
    interviewWeeks: Whole,
    /** The hour each recall day starts */
    dayStartsAt: Whole,
    followDeviceTimeZone: Type.Boolean(),
    rehearsalMinutes: RehearsalMinutes,
    codeLanguage: Language,
  },
  { additionalProperties: false },
);
export type LearnerSettingsValues = Static<typeof LearnerSettingsValues>;

export const SettingsResponse = Type.Object(
  {
    settings: LearnerSettingsValues,
    /** What Reset all puts back */
    suggested: LearnerSettingsValues,
    timeZone: Type.String(),
    interview: InterviewDateResponse,
  },
  { $id: "SettingsResponse" },
);
export type SettingsResponse = Static<typeof SettingsResponse>;

/** Only the settings sent change */
export const SettingsBody = Type.Object(
  {
    newCardsPerDay: Type.Optional(Whole),
    trackNewLimits: Type.Optional(TrackLimits),
    reviewsPerDay: Type.Optional(Type.Union([Whole, Type.Null()])),
    recallTarget: Type.Optional(Whole),
    interviewTarget: Type.Optional(Whole),
    interviewWeeks: Type.Optional(Whole),
    dayStartsAt: Type.Optional(Whole),
    followDeviceTimeZone: Type.Optional(Type.Boolean()),
    rehearsalMinutes: Type.Optional(RehearsalMinutes),
    codeLanguage: Type.Optional(Language),
    /** The device's zone when following it, or the one picked */
    timeZone: Type.Optional(TimeZoneName),
    interviewDate: Type.Optional(Type.Union([CalendarDate, Type.Null()])),
  },
  { additionalProperties: false },
);
export type SettingsBody = Static<typeof SettingsBody>;

export const SettingsProblemResponse = Type.Object(
  {
    code: Type.String(),
    message: Type.String(),
    /** Each setting that can't be saved, by its path, like "rehearsalMinutes.storyAnswer" */
    problems: Type.Array(
      Type.Object({ field: Type.String(), message: Type.String() }),
    ),
  },
  { $id: "SettingsProblemResponse" },
);
export type SettingsProblemResponse = Static<typeof SettingsProblemResponse>;

export const SETTINGS_ERRORS = {
  outOfRange: "settings_out_of_range",
} as const;

export const TimeZonesResponse = Type.Object(
  { timeZones: Type.Array(Type.String()) },
  { $id: "TimeZonesResponse" },
);
export type TimeZonesResponse = Static<typeof TimeZonesResponse>;
