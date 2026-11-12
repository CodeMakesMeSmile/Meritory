import Type, { type Static } from "typebox";

/** Lowercase words joined by hyphens */
export const ID_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

// No "@" before the path, so a link can't hide its real host behind a user name
export const SOURCE_URL_PATTERN = "^https://[^/?#@\\s]+([/?#]|$)";

/** Any text except control characters, apart from tab and newline */
// biome-ignore lint/security/noSecrets: a pattern, not a secret
export const TEXT_PATTERN = "^[^\\u0000-\\u0008\\u000B-\\u001F\\u007F]*$";

const Id = Type.String({ pattern: ID_PATTERN, maxLength: 80 });

const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });

export const Source = Type.Object(
  {
    url: Type.String({
      format: "url",
      pattern: SOURCE_URL_PATTERN,
      maxLength: 2048,
    }),
    title: Text(200),
  },
  { additionalProperties: false },
);
export type Source = Static<typeof Source>;

/** A named product, shown as an example of its category on a date */
export const Example = Type.Object(
  {
    product: Text(80),
    version: Type.Optional(Text(40)),
  },
  { additionalProperties: false },
);
export type Example = Static<typeof Example>;

export const Fact = Type.Object(
  {
    id: Id,
    claim: Text(1000),
    examples: Type.Optional(Type.Array(Example)),
    sources: Type.Array(Source, { minItems: 1 }),
    /** The day every source was last read */
    checkedOn: Type.String({ format: "date" }),
  },
  { additionalProperties: false },
);
export type Fact = Static<typeof Fact>;

/** One category's facts, as written in a file */
export const FactFile = Type.Object(
  {
    category: Id,
    facts: Type.Array(Fact),
  },
  { additionalProperties: false },
);
export type FactFile = Static<typeof FactFile>;

export const Category = Type.Object(
  {
    id: Id,
    name: Text(80),
  },
  { additionalProperties: false },
);
export type Category = Static<typeof Category>;

export const CategoryFile = Type.Array(Category);
export type CategoryFile = Static<typeof CategoryFile>;

/** A fact with the category it was filed under */
export type CategorizedFact = Fact & { category: string };
