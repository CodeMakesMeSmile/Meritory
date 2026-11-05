import Type, { type Static } from "typebox";

export const ErrorResponse = Type.Object(
  {
    code: Type.String({ examples: ["not_found"] }),
    message: Type.String(),
  },
  { $id: "ErrorResponse" },
);

export type ErrorResponse = Static<typeof ErrorResponse>;
