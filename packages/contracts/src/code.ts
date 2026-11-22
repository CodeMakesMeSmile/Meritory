import Type, { type Static } from "typebox";

/** The languages the code runner checks */
export const CODE_LANGUAGES = ["typescript", "python"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** Code longer than this is refused before it reaches the runner */
export const MAX_CODE_LENGTH = 65536;

/** The runner's own cap, in UTF-8 bytes, which code under the length can still pass */
export const MAX_CODE_BYTES = 65536;

const Id = Type.String({ pattern: "^[a-z0-9]+(-[a-z0-9]+)*$", maxLength: 80 });

export const CodeRunBody = Type.Object(
  {
    trackId: Id,
    chapterId: Id,
    exerciseId: Id,
    language: Type.Union(CODE_LANGUAGES.map((l) => Type.Literal(l))),
    code: Type.String({ maxLength: MAX_CODE_LENGTH }),
  },
  { additionalProperties: false },
);
export type CodeRunBody = Static<typeof CodeRunBody>;

const Status = Type.Union([
  Type.Literal("pass"),
  Type.Literal("fail"),
  Type.Literal("error"),
]);

/** Exercism's results.json, version 3 */
export const CodeRunResponse = Type.Object(
  {
    version: Type.Literal(3),
    status: Status,
    /** Why nothing ran, like a syntax error */
    message: Type.Optional(Type.String()),
    tests: Type.Array(
      Type.Object({
        name: Type.String(),
        status: Status,
        message: Type.Optional(Type.String()),
      }),
    ),
  },
  { $id: "CodeRunResponse" },
);
export type CodeRunResponse = Static<typeof CodeRunResponse>;

/** Error codes the code routes answer with */
export const CODE_ERRORS = {
  runnerOffline: "runner_offline",
  runnerBusy: "runner_busy",
  runnerFailed: "runner_failed",
  codeTooLarge: "code_too_large",
} as const;
