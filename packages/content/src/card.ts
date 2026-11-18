import Type, { type Static } from "typebox";
import { ID_PATTERN, Source, TEXT_PATTERN } from "./fact.ts";

const Id = Type.String({ pattern: ID_PATTERN, maxLength: 80 });

/** Plain text, such as a title */
const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });

/** CommonMark, checked like a chapter explanation */
const Markdown = (maxLength: number) => Text(maxLength);

/** What a lesson shows after a miss */
export const Lesson = Type.Object(
  {
    title: Text(120),
    explanation: Markdown(3000),
    happened: Type.Optional(Markdown(3000)),
    fix: Type.Optional(Markdown(3000)),
    source: Type.Optional(Source),
  },
  { additionalProperties: false },
);
export type Lesson = Static<typeof Lesson>;

const common = {
  id: Id,
  /** A skill from the card's chapter */
  skill: Id,
  /** Whether the card asks what something is, why it works, or when to use it */
  asks: Type.Union([
    Type.Literal("what"),
    Type.Literal("why"),
    Type.Literal("when"),
  ]),
  prompt: Markdown(2000),
  /** The same question in other words, for the retry after a miss */
  reworded: Markdown(2000),
  misconception: Type.Optional(Markdown(1000)),
  lesson: Lesson,
};

export const PromptCard = Type.Object(
  {
    ...common,
    type: Type.Literal("prompt"),
    /** What a good answer covers, shown on reveal */
    points: Type.Array(Markdown(500), { minItems: 1, maxItems: 8 }),
  },
  { additionalProperties: false },
);

export const Term = Type.Object(
  {
    term: Text(80),
    definition: Markdown(500),
  },
  { additionalProperties: false },
);

export const OrderingCard = Type.Object(
  {
    ...common,
    type: Type.Literal("ordering"),
    /** In the right order, shuffled when shown */
    steps: Type.Array(Markdown(300), { minItems: 3, maxItems: 10 }),
    terms: Type.Optional(Type.Array(Term, { maxItems: 10 })),
  },
  { additionalProperties: false },
);

export const Pair = Type.Object(
  {
    item: Markdown(300),
    match: Markdown(120),
  },
  { additionalProperties: false },
);

export const MatchingCard = Type.Object(
  {
    ...common,
    type: Type.Literal("matching"),
    pairs: Type.Array(Pair, { minItems: 2, maxItems: 6 }),
    /** Wrong matches shown among the right ones */
    extraMatches: Type.Optional(Type.Array(Markdown(120), { maxItems: 4 })),
    /** The name above the matches, such as Causes */
    matchHeading: Text(40),
  },
  { additionalProperties: false },
);

export const Option = Type.Object(
  {
    text: Markdown(300),
    correct: Type.Optional(Type.Boolean()),
    /** Why the option is right or wrong, shown after the answer */
    reason: Markdown(500),
  },
  { additionalProperties: false },
);

export const PickOneCard = Type.Object(
  {
    ...common,
    type: Type.Literal("pick-one"),
    options: Type.Array(Option, { minItems: 2, maxItems: 6 }),
  },
  { additionalProperties: false },
);

export const CARD_SCHEMAS = {
  prompt: PromptCard,
  ordering: OrderingCard,
  matching: MatchingCard,
  "pick-one": PickOneCard,
} as const;

export type PromptCard = Static<typeof PromptCard>;
export type OrderingCard = Static<typeof OrderingCard>;
export type MatchingCard = Static<typeof MatchingCard>;
export type PickOneCard = Static<typeof PickOneCard>;
export type Card = PromptCard | OrderingCard | MatchingCard | PickOneCard;
