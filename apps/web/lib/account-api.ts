import type {
  AccountSession,
  ErrorResponse,
  SessionsResponse,
} from "@meritory/contracts";

export type { AccountSession };

// Copied so the page doesn't bundle the schema library. A test keeps them equal.
export const SESSION_ERRORS = {
  confirmPassword: "confirm_password",
  currentSession: "current_session",
  wrongPassword: "wrong_password",
} as const;

/** What a session request came back with, in terms the page acts on */
export type AccountResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; reason: "confirm_password" }
  | { ok: false; reason: "wrong_password" }
  | { ok: false; reason: "rate_limited"; retryAfter: string | null }
  | { ok: false; reason: "gone" }
  | { ok: false; reason: "signed_out" }
  | { ok: false; reason: "failed" };

const BASE = "/api/v1/me";

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<AccountResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (res.ok) {
    const data = res.status === 204 ? undefined : await res.json();
    return { ok: true, data: data as T };
  }
  if (res.status === 401) return { ok: false, reason: "signed_out" };
  if (res.status === 404) return { ok: false, reason: "gone" };
  if (res.status === 429) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfter: res.headers.get("retry-after"),
    };
  }
  const body = (await res.json().catch(() => null)) as ErrorResponse | null;
  if (body?.code === SESSION_ERRORS.confirmPassword) {
    return { ok: false, reason: "confirm_password" };
  }
  if (body?.code === SESSION_ERRORS.wrongPassword) {
    return { ok: false, reason: "wrong_password" };
  }
  return { ok: false, reason: "failed" };
}

export function listSessions() {
  return call<SessionsResponse>("/sessions");
}

export function endSession(id: string) {
  return call(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function endOtherSessions() {
  return call<{ ended: number }>("/sessions/end-others", { method: "POST" });
}

export function confirmPassword(password: string) {
  return call("/confirm-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
}
