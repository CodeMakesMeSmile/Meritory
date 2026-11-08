/** A sign-out waiting on "Confirm it's you", kept while the page visits GitHub or Google */
export type SessionAction = { kind: "one"; id: string } | { kind: "others" };

const KEY = "meritory.pending-session-action";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function savePendingAction(action: SessionAction) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(action));
  } catch {
    // Without storage they press the button again after coming back
  }
}

/** Reads and forgets the saved action. Anything malformed counts as nothing. */
export function takePendingAction(): SessionAction | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    return null;
  }
  try {
    const value = JSON.parse(raw ?? "null") as Partial<SessionAction> | null;
    if (value?.kind === "others") return { kind: "others" };
    if (
      value?.kind === "one" &&
      typeof value.id === "string" &&
      UUID.test(value.id)
    ) {
      return { kind: "one", id: value.id };
    }
  } catch {
    // Falls through
  }
  return null;
}
