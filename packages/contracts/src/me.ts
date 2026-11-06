import Type, { type Static } from "typebox";

export const MeResponse = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
    name: Type.String(),
    email: Type.String({ format: "email" }),
  },
  { $id: "MeResponse" },
);
export type MeResponse = Static<typeof MeResponse>;
