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

// Practice answers, code, and rehearsals from lib/practice, lib/code, and lib/rehearsal
const DRAFT_PREFIXES = [
  "meritory.practice.",
  "meritory.code.",
  "meritory.rehearsal.",
];

/** Forgets this browser's drafts and where recall stopped, so the next person here doesn't see them */
export function clearDrafts() {
  try {
    const storage = window.localStorage;
    const keys = Array.from({ length: storage.length }, (_, i) =>
      storage.key(i),
    );
    for (const key of keys) {
      if (key && DRAFT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Blocked storage has nothing to clear
  }
  writeStoppedAt(null);
}

const OWNER_KEY = "meritory.owner";

/** Drafts left by another account are forgotten, since a session can end without a sign out */
export function claimDrafts(userId: string) {
  const owner = readStored(OWNER_KEY);
  if (owner === userId) return;
  if (owner !== null) clearDrafts();
  writeStored(OWNER_KEY, userId);
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

// A recall day starts at 4 a.m., so a count from before then is yesterday's
function recallDay(now: Date): string {
  const day = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
}

/** Where today's last sitting stopped, kept for this tab only */
export function readStoppedAt(now = new Date()): StoppedAt | null {
  const raw = readStored(STOPPED_KEY, "session");
  const match = raw ? /^(\d{1,4})\/(\d{1,4})@([\d-]{8,10})$/.exec(raw) : null;
  if (!match || match[3] !== recallDay(now)) return null;
  const done = Number(match[1]);
  const total = Number(match[2]);
  return done > 0 && done < total ? { done, total } : null;
}

export function writeStoppedAt(stopped: StoppedAt | null, now = new Date()) {
  writeStored(
    STOPPED_KEY,
    stopped ? `${stopped.done}/${stopped.total}@${recallDay(now)}` : null,
    "session",
  );
}
