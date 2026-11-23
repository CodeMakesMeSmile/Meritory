"use client";

import { useEffect, useRef } from "react";
import { saveTimeZone } from "@/lib/recall-api";

/** The browser's own IANA name, as it reports it */
export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

// Zones the server refused, so they aren't sent again on every return to the tab
const refused = new Set<string>();

/**
 * Sends the browser's zone when it differs from the one the server holds, and
 * returns the zone the server holds afterwards. Another device may have changed it.
 */
export async function syncTimeZone(saved: string): Promise<string> {
  const timeZone = browserTimeZone();
  if (!timeZone || timeZone === saved || refused.has(timeZone)) return saved;
  const result = await saveTimeZone(timeZone);
  if (result.ok) return timeZone;
  if (
    result.reason === "failed" &&
    result.code &&
    result.code !== "rate_limited"
  ) {
    refused.add(timeZone);
  }
  return saved;
}

/** A recall day starts at 4 a.m. where the learner is, so the API needs their zone */
export function TimeZoneSync({ timeZone }: { timeZone: string }) {
  const saved = useRef(timeZone);
  useEffect(() => {
    saved.current = timeZone;
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      void syncTimeZone(saved.current).then((now) => {
        saved.current = now;
      });
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [timeZone]);
  return null;
}
