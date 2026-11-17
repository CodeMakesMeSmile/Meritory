import Type, { type Static } from "typebox";
import { ID_PATTERN, TEXT_PATTERN } from "./fact.ts";

const Id = Type.String({ pattern: ID_PATTERN, maxLength: 80 });

const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });

export const TrackFile = Type.Object(
  {
    id: Id,
    title: Text(80),
  },
  { additionalProperties: false },
);
export type TrackFile = Static<typeof TrackFile>;

export const Skill = Type.Object(
  {
    id: Id,
    name: Text(120),
  },
  { additionalProperties: false },
);
export type Skill = Static<typeof Skill>;

export const ChapterFile = Type.Object(
  {
    id: Id,
    title: Text(120),
    /** Where the chapter sits in its track, starting at 1 */
    order: Type.Integer({ minimum: 1, maximum: 999 }),
    skills: Type.Array(Skill, { minItems: 1 }),
    /** Chapters in the same track to finish first */
    prerequisites: Type.Optional(Type.Array(Id)),
  },
  { additionalProperties: false },
);
export type ChapterFile = Static<typeof ChapterFile>;
