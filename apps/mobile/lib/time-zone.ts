import type { RecallApi } from "@meritory/recall-client";

/** The phone's own IANA name, as it reports it */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export interface TimeZoneSync {
  /** Sends the zone when it differs from the last one that arrived */
  sync(timeZone: string | null): Promise<void>;
  /** After sign-out, so the next account gets its zone sent */
  reset(): void;
}

/** A recall day starts at 4 a.m. where the learner is, so the API needs their zone */
export function createTimeZoneSync(
  save: RecallApi["saveTimeZone"],
): TimeZoneSync {
  let sent: string | null = null;
  // Zones the server refused, so they aren't sent again on every return to the app
  const refused = new Set<string>();
  return {
    async sync(timeZone) {
      if (!timeZone || timeZone === sent || refused.has(timeZone)) return;
      const result = await save(timeZone);
      if (result.ok) {
        sent = timeZone;
      } else if (result.refused) {
        refused.add(timeZone);
      }
    },
    reset() {
      sent = null;
    },
  };
}
