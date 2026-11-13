import {
  EMAIL_PATTERN,
  isProvider,
  type Provider,
} from "@meritory/contracts/sign-in-messages";

/** A sign-out waiting on "Confirm it's you", kept while the page visits GitHub or Google */
export type SessionAction = { kind: "one"; id: string } | { kind: "others" };

/** A link or unlink waiting the same way */
export interface MethodAction {
  kind: "link" | "unlink";
  provider: Provider;
}

const SESSION_KEY = "meritory.pending-session-action";
const METHOD_KEY = "meritory.pending-method-action";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function save(key: string, action: object) {
  try {
    sessionStorage.setItem(key, JSON.stringify(action));
  } catch {
    // Without storage they press the button again after coming back
  }
}

// Reads and forgets, so nothing saved can run twice
function take(key: string): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return JSON.parse(raw ?? "null") as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export function savePendingAction(action: SessionAction) {
  save(SESSION_KEY, action);
}

/** Reads and forgets the saved action. Anything malformed counts as nothing. */
export function takePendingAction(): SessionAction | null {
  const value = take(SESSION_KEY);
  if (value?.kind === "others") return { kind: "others" };
  if (
    value?.kind === "one" &&
    typeof value.id === "string" &&
    UUID.test(value.id)
  ) {
    return { kind: "one", id: value.id };
  }
  return null;
}

export function savePendingMethod(action: MethodAction) {
  save(METHOD_KEY, action);
}

/** Reads and forgets the saved link or unlink. Anything malformed counts as nothing. */
export function takePendingMethod(): MethodAction | null {
  const value = take(METHOD_KEY);
  if (
    (value?.kind === "link" || value?.kind === "unlink") &&
    isProvider(value.provider)
  ) {
    return { kind: value.kind, provider: value.provider };
  }
  return null;
}

const EMAIL_KEY = "meritory.pending-email-change";

/** An email change waiting on "Confirm it's you" with GitHub or Google */
export function savePendingEmail(email: string) {
  save(EMAIL_KEY, { email });
}

/** Reads and forgets the saved address. Anything malformed counts as nothing. */
export function takePendingEmail(): string | null {
  const value = take(EMAIL_KEY);
  return typeof value?.email === "string" && EMAIL_PATTERN.test(value.email)
    ? value.email
    : null;
}
