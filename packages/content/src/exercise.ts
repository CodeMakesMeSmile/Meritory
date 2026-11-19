import Type, { type Static } from "typebox";
import { ID_PATTERN, TEXT_PATTERN } from "./fact.ts";

const Id = Type.String({ pattern: ID_PATTERN, maxLength: 80 });

const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });

/** The value types LeetCode uses, before any [] */
export const BASE_TYPES = [
  "int",
  "long",
  "double",
  "boolean",
  "char",
  "string",
  "ListNode",
  "TreeNode",
];

const VALUE_TYPE = `(${BASE_TYPES.join("|")})(\\[\\]){0,2}`;

/** A value type, with up to two levels of array */
export const TYPE_PATTERN = `^${VALUE_TYPE}$`;

/** What a function or method returns, which can also be nothing */
export const RETURN_PATTERN = `^(void|${VALUE_TYPE})$`;

/** A function, method, or parameter name in camelCase */
export const NAME_PATTERN = "^[a-z][A-Za-z0-9]{0,39}$";

/** A class name in PascalCase */
export const CLASS_PATTERN = "^[A-Z][A-Za-z0-9]{0,39}$";

/** A version 4 uuid, as Exercism uses for every case */
export const UUID_PATTERN =
  "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";

const KINDS = ["coding", "design"] as const;

/** An exercise's kind, as a pattern so a typo gets one message */
export const KIND_PATTERN = `^(${KINDS.join("|")})$`;

/** How far apart two doubles can be and still match */
export const DOUBLE_TOLERANCE = 1e-5;

const ValueType = Type.String({ pattern: TYPE_PATTERN });
const ReturnType = Type.String({ pattern: RETURN_PATTERN });
const Name = Type.String({ pattern: NAME_PATTERN });

export const Param = Type.Object(
  {
    name: Name,
    type: ValueType,
    /** Set up the input but never passed in, like where a list's cycle starts */
    hidden: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);
export type Param = Static<typeof Param>;

export const FunctionSignature = Type.Object(
  {
    function: Name,
    params: Type.Array(Param, { minItems: 1, maxItems: 8 }),
    returns: ReturnType,
    /** The parameter whose final value is checked, when the function returns void */
    checks: Type.Optional(Name),
    /** The answer is a list whose order doesn't matter */
    anyOrder: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);
export type FunctionSignature = Static<typeof FunctionSignature>;

export const Method = Type.Object(
  {
    name: Name,
    params: Type.Array(Param, { maxItems: 8 }),
    returns: ReturnType,
  },
  { additionalProperties: false },
);
export type Method = Static<typeof Method>;

/** A design problem, tested by a list of calls on one object */
export const ClassSignature = Type.Object(
  {
    class: Type.String({ pattern: CLASS_PATTERN }),
    /** What the constructor takes */
    params: Type.Array(Param, { maxItems: 8 }),
    methods: Type.Array(Method, { minItems: 1, maxItems: 12 }),
  },
  { additionalProperties: false },
);
export type ClassSignature = Static<typeof ClassSignature>;

export type Signature = FunctionSignature | ClassSignature;

export const ExerciseFile = Type.Object(
  {
    id: Id,
    /** Coding exercises are run against cases, and design ones only use the rubric */
    kind: Type.Unsafe<(typeof KINDS)[number]>(
      Type.String({ pattern: KIND_PATTERN }),
    ),
    title: Text(120),
    difficulty: Type.Union([
      Type.Literal("easy"),
      Type.Literal("medium"),
      Type.Literal("hard"),
    ]),
    /** Skills from the exercise's chapter */
    skills: Type.Array(Id, { minItems: 1 }),
    /** The paired exercise of the same kind in the same chapter, used for transfer checks */
    sibling: Id,
    /** A rubric in the exercise's track */
    rubric: Id,
    /** Rubric criteria that must reach the required level to pass */
    requires: Type.Optional(Type.Array(Id, { minItems: 1 })),
    /** Checked as a function or a class signature, by whether it names a class */
    signature: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  },
  { additionalProperties: false },
);
export type ExerciseFile = Static<typeof ExerciseFile>;

const Uuid = Type.String({ pattern: UUID_PATTERN });

/** One test case in Exercism's canonical-data format */
export const TestCase = Type.Object(
  {
    uuid: Uuid,
    description: Text(200),
    /** The function or class under test */
    property: Type.String({ maxLength: 40 }),
    input: Type.Record(Type.String(), Type.Unknown()),
    /** The answer, or `{"error": ...}` when the input must be refused */
    expected: Type.Unknown(),
    /** The case this one fixes, which stays in the file */
    reimplements: Type.Optional(Uuid),
    comments: Type.Optional(Type.Array(Text(500))),
  },
  { additionalProperties: false },
);
export type TestCase = Static<typeof TestCase>;

/** The model answer a design exercise shows after you score yourself */
export const ANSWER_FILE = "answer.md";

/** The reference solution files every exercise needs, one per language */
export const SOLUTION_FILES = [
  "solution.ts",
  "solution.py",
  "Solution.java",
  "solution.c",
];
