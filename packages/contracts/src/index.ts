export { ErrorResponse } from "./errors.ts";
export { CheckStatus, LiveResponse, ReadyResponse } from "./health.ts";
export { MeResponse } from "./me.ts";

/** Prefix for every versioned route */
export const API_PREFIX = "/v1";
export {
  AccountSession,
  ConfirmPasswordBody,
  EndOthersResponse,
  SESSION_ERRORS,
  SessionParams,
  SessionsResponse,
} from "./sessions.ts";
