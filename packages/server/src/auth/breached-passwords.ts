import { createHash } from "node:crypto";

/** Have I Been Pwned's k-anonymity range API, which only ever sees the first 5 characters of the hash */
export const RANGE_URL = "https://api.pwnedpasswords.com/range/";

const TIMEOUT_MS = 3000;

/** Answers true when the password is in a known breach */
export type BreachCheck = (password: string) => Promise<boolean>;

export interface BreachCheckOptions {
  /** Called when the service can't answer, so the password is let through */
  onUnavailable(reason: string): void;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function createBreachCheck(options: BreachCheckOptions): BreachCheck {
  const send = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  return async (password) => {
    const hash = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    try {
      const res = await send(`${RANGE_URL}${hash.slice(0, 5)}`, {
        headers: { "Add-Padding": "true", "User-Agent": "Meritory" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        options.onUnavailable(`status ${res.status}`);
        return false;
      }
      return foundIn(await res.text(), hash.slice(5));
    } catch (error) {
      options.onUnavailable(error instanceof Error ? error.name : "unknown");
      return false;
    }
  };
}

// Padding lines have a count of 0, so they never match a real password
export function foundIn(body: string, suffix: string): boolean {
  for (const line of body.split("\n")) {
    const [lineSuffix, count] = line.trim().split(":");
    if (lineSuffix?.toUpperCase() === suffix && Number(count) > 0) return true;
  }
  return false;
}
