import Type, { type Static } from "typebox";

const UUID = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

export const AccountSession = Type.Object(
  {
    id: Type.String({ pattern: UUID }),
    device: Type.String({ examples: ["Chrome on Windows"] }),
    signedInAt: Type.String({ format: "date-time" }),
    /** Day precision, since it only updates once a day */
    lastActiveAt: Type.String({ format: "date-time" }),
    current: Type.Boolean(),
  },
  { $id: "AccountSession" },
);
export type AccountSession = Static<typeof AccountSession>;

export const SessionsResponse = Type.Object(
  { sessions: Type.Array(AccountSession) },
  { $id: "SessionsResponse" },
);
export type SessionsResponse = Static<typeof SessionsResponse>;

export const SessionParams = Type.Object({
  id: Type.String({ pattern: UUID }),
});
export type SessionParams = Static<typeof SessionParams>;

export const EndOthersResponse = Type.Object(
  { ended: Type.Integer({ minimum: 0 }) },
  { $id: "EndOthersResponse" },
);
export type EndOthersResponse = Static<typeof EndOthersResponse>;

export const ConfirmPasswordBody = Type.Object(
  { password: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);
export type ConfirmPasswordBody = Static<typeof ConfirmPasswordBody>;

/** Error codes the session routes answer with */
export const SESSION_ERRORS = {
  confirmPassword: "confirm_password",
  currentSession: "current_session",
  wrongPassword: "wrong_password",
} as const;
