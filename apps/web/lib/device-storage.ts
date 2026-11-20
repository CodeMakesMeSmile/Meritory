// Private windows and blocked site data throw, so every read and write can fail quietly

type Area = "local" | "session";

function area(which: Area): Storage | null {
  try {
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(key: string, which: Area = "local") {
  try {
    return area(which)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(
  key: string,
  value: string | null,
  which: Area = "local",
) {
  try {
    const storage = area(which);
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // The page works the same without it
  }
}

const SHORTCUTS_KEY = "meritory.shortcuts";

/** Single-key shortcuts are on unless this browser turned them off */
export function shortcutsOn(): boolean {
  return readStored(SHORTCUTS_KEY) !== "off";
}

export function setShortcutsOn(on: boolean) {
  writeStored(SHORTCUTS_KEY, on ? null : "off");
}

const STOPPED_KEY = "meritory.recall.stopped";

export interface StoppedAt {
  done: number;
  total: number;
}

/** Where the last sitting stopped, kept for this tab only */
export function readStoppedAt(): StoppedAt | null {
  const raw = readStored(STOPPED_KEY, "session");
  const match = raw ? /^(\d{1,4})\/(\d{1,4})$/.exec(raw) : null;
  if (!match) return null;
  const done = Number(match[1]);
  const total = Number(match[2]);
  return done > 0 && done < total ? { done, total } : null;
}

export function writeStoppedAt(stopped: StoppedAt | null) {
  writeStored(
    STOPPED_KEY,
    stopped ? `${stopped.done}/${stopped.total}` : null,
    "session",
  );
}
