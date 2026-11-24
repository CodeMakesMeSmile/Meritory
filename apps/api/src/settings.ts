import {
  type ErrorResponse,
  SETTINGS_ERRORS,
  SettingsBody,
  type SettingsProblemResponse,
  SettingsResponse,
  TimeZonesResponse,
} from "@meritory/contracts";
import {
  checkSettings,
  isCalendarDate,
  isKnownTimeZone,
  type LearnerSettings,
  type SettingProblem,
  SUGGESTED_SETTINGS,
} from "@meritory/learning";
import type { SettingsChange, StoredSettings } from "@meritory/server";
import type { FastifyInstance } from "fastify";
import { interviewAnswer } from "./learner-day.ts";
import type { RecallDependencies } from "./recall.ts";
import type { CurrentSession } from "./session.ts";

/** Settings writes each user may make in a minute */
export const SETTINGS_WRITES_PER_MINUTE = 20;

const BODY_LIMIT = 4096;

const LEARNER_FIELDS = [
  // biome-ignore lint/security/noSecrets: a setting name, not a secret
  "newCardsPerDay",
  "trackNewLimits",
  "reviewsPerDay",
  "recallTarget",
  "interviewTarget",
  "interviewWeeks",
  "dayStartsAt",
  "followDeviceTimeZone",
  "rehearsalMinutes",
  "codeLanguage",
] as const satisfies readonly (keyof LearnerSettings)[];

const perMinute = (max: number, groupId: string) => ({
  rateLimit: { max, timeWindow: "1 minute", groupId },
});

export async function registerSettingsRoutes(
  scope: FastifyInstance,
  deps: RecallDependencies,
) {
  const tracks = new Set(deps.chapters.map((chapter) => chapter.trackId));

  function answer(stored: StoredSettings): SettingsResponse {
    return {
      settings: stored.learner,
      suggested: SUGGESTED_SETTINGS,
      timeZone: stored.timeZone,
      interview: interviewAnswer(stored, deps.now()).answer,
    };
  }

  scope.get(
    "/me/settings",
    {
      schema: {
        summary: "Study settings, with the suggested value of each",
        tags: ["account"],
        response: { 200: SettingsResponse },
      },
      config: perMinute(60, "recall-reads"),
    },
    async (request) => {
      const { user } = request.current as CurrentSession;
      return answer(await deps.store.settings(user.id));
    },
  );

  // The zones this server accepts, for a phone whose engine can't list them
  const timeZones = Intl.supportedValuesOf("timeZone");

  scope.get(
    "/time-zones",
    {
      schema: {
        summary: "Every time zone a learner can pick",
        tags: ["account"],
        response: { 200: TimeZonesResponse },
      },
      config: perMinute(60, "recall-reads"),
    },
    async () => ({ timeZones }),
  );

  scope.put<{ Body: SettingsBody }>(
    "/me/settings",
    {
      bodyLimit: BODY_LIMIT,
      schema: {
        summary:
          "Change the settings sent. Nothing saves unless every one is in range.",
        tags: ["account"],
        body: SettingsBody,
        response: { 200: SettingsResponse },
      },
      config: perMinute(SETTINGS_WRITES_PER_MINUTE, "settings-writes"),
    },
    async (request, reply) => {
      const { user } = request.current as CurrentSession;
      const body = request.body;
      const stored = await deps.store.settings(user.id);
      const sent = LEARNER_FIELDS.filter((field) => body[field] !== undefined);
      const learner: LearnerSettings = {
        ...stored.learner,
        ...Object.fromEntries(sent.map((field) => [field, body[field]])),
      };
      const problems: SettingProblem[] = checkSettings(learner);
      for (const track of Object.keys(body.trackNewLimits ?? {})) {
        if (!tracks.has(track)) {
          problems.push({
            field: `trackNewLimits.${track}`,
            message: "That track doesn't exist.",
          });
        }
      }
      if (body.timeZone !== undefined && !isKnownTimeZone(body.timeZone)) {
        problems.push({
          field: "timeZone",
          message: "Pick a time zone from the list.",
        });
      }
      const date = body.interviewDate;
      if (date) {
        const timeZone =
          body.timeZone && isKnownTimeZone(body.timeZone)
            ? body.timeZone
            : stored.timeZone;
        const { day } = interviewAnswer(
          { ...stored, learner, timeZone },
          deps.now(),
        );
        if (!isCalendarDate(date)) {
          problems.push({
            field: "interviewDate",
            message: "That isn't a date. Pick one from the calendar.",
          });
        } else if (date < day) {
          problems.push({
            field: "interviewDate",
            message: "That date has passed. Pick today or a later date.",
          });
        }
      }
      if (problems.length) {
        return reply.code(400).send({
          code: SETTINGS_ERRORS.outOfRange,
          message: "Some settings can't be saved. Check the ones marked.",
          problems,
        } satisfies ErrorResponse & SettingsProblemResponse);
      }
      const change: SettingsChange = {};
      if (sent.length) change.learner = learner;
      if (body.timeZone !== undefined) change.timeZone = body.timeZone;
      if (date !== undefined) change.interviewDate = date;
      await deps.store.saveSettings(user.id, change);
      return answer(await deps.store.settings(user.id));
    },
  );

  scope.post(
    "/me/settings/reset",
    {
      schema: {
        summary:
          "Put every study setting back to its suggested value. The interview date stays.",
        tags: ["account"],
        response: { 200: SettingsResponse },
      },
      config: perMinute(SETTINGS_WRITES_PER_MINUTE, "settings-writes"),
    },
    async (request) => {
      const { user } = request.current as CurrentSession;
      await deps.store.resetSettings(user.id);
      return answer(await deps.store.settings(user.id));
    },
  );
}
