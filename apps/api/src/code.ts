import rateLimit from "@fastify/rate-limit";
import {
  CODE_ERRORS,
  type CodeLanguage,
  CodeRunBody,
  CodeRunResponse,
  type ErrorResponse,
} from "@meritory/contracts";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ServedChapter } from "./content.ts";

/** What the runner said, in terms the route answers with */
export type RunnerAnswer =
  | { kind: "ok"; result: CodeRunResponse }
  | { kind: "busy" }
  | { kind: "offline" }
  | { kind: "failed" };

export interface CodeRunner {
  run(request: {
    language: CodeLanguage;
    code: string;
    signature: Record<string, unknown>;
    cases: unknown[];
  }): Promise<RunnerAnswer>;
}

/** A run waits this long before it counts as failed, above the runner's own limits */
const RUNNER_TIMEOUT_MS = 60_000;

/** Calls the runner inside WSL2 on localhost, see docs/runner.md */
export function createCodeRunner(options: {
  url: string;
  token: string;
  fetch?: typeof fetch;
}): CodeRunner {
  const send = options.fetch ?? fetch;
  return {
    async run(request) {
      let res: Response;
      try {
        res = await send(`${options.url}/runs`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${options.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(RUNNER_TIMEOUT_MS),
        });
      } catch (error) {
        const name = (error as Error).name;
        return name === "TimeoutError"
          ? { kind: "failed" }
          : { kind: "offline" };
      }
      if (res.status === 429) return { kind: "busy" };
      if (!res.ok) return { kind: "failed" };
      return { kind: "ok", result: (await res.json()) as CodeRunResponse };
    },
  };
}

export interface CodeDependencies {
  /** Unset when RUNNER_URL and RUNNER_TOKEN aren't */
  runner?: CodeRunner;
  chapters: ServedChapter[];
}

/** Runs each user may start in a minute */
export const CODE_RUN_LIMIT = 20;

function refuse(reply: FastifyReply, status: number, body: ErrorResponse) {
  return reply.code(status).send(body);
}

const OFFLINE =
  "The code runner isn't running. Start it in Ubuntu, then try again.";

export async function registerCodeRoutes(
  scope: FastifyInstance,
  deps: CodeDependencies,
) {
  await scope.register(rateLimit, {
    global: false,
    hook: "preHandler",
    keyGenerator: (request) => request.user?.id ?? request.ip,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      message: `Too many runs. Try again in ${context.after}.`,
    }),
  });

  scope.post<{ Body: CodeRunBody }>(
    "/code/runs",
    {
      bodyLimit: 128 * 1024,
      schema: {
        summary: "Check an answer to a coding exercise against its cases",
        tags: ["code"],
        body: CodeRunBody,
        response: { 200: CodeRunResponse },
      },
      config: {
        rateLimit: {
          max: CODE_RUN_LIMIT,
          timeWindow: "1 minute",
          groupId: "code-runs",
        },
      },
    },
    async (request, reply) => {
      const { trackId, chapterId, exerciseId, language, code } = request.body;
      const exercise = deps.chapters
        .find((c) => c.trackId === trackId && c.chapterId === chapterId)
        ?.coding?.find((e) => e.id === exerciseId);
      if (!exercise) {
        return refuse(reply, 404, {
          code: "not_found",
          message: "That coding exercise doesn't exist.",
        });
      }
      if (!deps.runner) {
        return refuse(reply, 503, {
          code: CODE_ERRORS.runnerOffline,
          message: OFFLINE,
        });
      }
      const answer = await deps.runner.run({
        language,
        code,
        signature: exercise.signature,
        cases: exercise.cases,
      });
      switch (answer.kind) {
        case "ok":
          return answer.result;
        case "busy":
          return refuse(reply, 429, {
            code: CODE_ERRORS.runnerBusy,
            message: "The runner is busy. Try again in a moment.",
          });
        case "offline":
          return refuse(reply, 503, {
            code: CODE_ERRORS.runnerOffline,
            message: OFFLINE,
          });
        default:
          return refuse(reply, 502, {
            code: CODE_ERRORS.runnerFailed,
            message: "The runner couldn't check that. Try again.",
          });
      }
    },
  );
}
