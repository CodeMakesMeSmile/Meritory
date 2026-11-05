import Type, { type Static } from "typebox";

export const LiveResponse = Type.Object(
  { status: Type.Literal("ok") },
  { $id: "LiveResponse" },
);
export type LiveResponse = Static<typeof LiveResponse>;

export const CheckStatus = Type.Union([
  Type.Literal("ok"),
  Type.Literal("down"),
]);

export const ReadyResponse = Type.Object(
  {
    status: CheckStatus,
    checks: Type.Object({ database: CheckStatus }),
  },
  { $id: "ReadyResponse" },
);
export type ReadyResponse = Static<typeof ReadyResponse>;
