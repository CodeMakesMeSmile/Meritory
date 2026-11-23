import Type, { type Static } from "typebox";
import { ID_PATTERN, TEXT_PATTERN } from "./fact.ts";
import { LEVELS, REQUIRED_LEVEL } from "./levels.ts";

const Id = Type.String({ pattern: ID_PATTERN, maxLength: 80 });

const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });

// Kept apart from the schemas, so a page can use them without loading TypeBox
export { LEVELS, REQUIRED_LEVEL };

const SCORERS = ["tests", "self"] as const;

/** Who gives a criterion its score, as a pattern so a typo gets one message */
export const SCORER_PATTERN = `^(${SCORERS.join("|")})$`;

export const Criterion = Type.Object(
  {
    id: Id,
    name: Text(80),
    /** Who gives the score, since AI scoring waits for Milestone 3 */
    scoredBy: Type.Unsafe<(typeof SCORERS)[number]>(
      Type.String({ pattern: SCORER_PATTERN }),
    ),
    /** What the work looks like at each level from 1 up, in CommonMark */
    levels: Type.Array(Type.String({ maxLength: 500, pattern: TEXT_PATTERN })),
  },
  { additionalProperties: false },
);
export type Criterion = Static<typeof Criterion>;

export const RubricFile = Type.Object(
  {
    id: Id,
    title: Text(120),
    criteria: Type.Array(Criterion, { minItems: 1, maxItems: 10 }),
    pass: Type.Object(
      {
        /** The lowest total that passes */
        total: Type.Integer({ minimum: 1 }),
        /** The lowest level any one criterion can score in a pass */
        lowest: Type.Integer(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);
export type RubricFile = Static<typeof RubricFile>;
