"use client";

import { useEffect } from "react";
import { readStored, writeStored } from "@/lib/device-storage";
import { saveTimeZone } from "@/lib/recall-api";

/** The browser's own IANA name, as it reports it */
export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Sends the time zone when it differs from the last one this browser sent */
export async function syncTimeZone(userId: string) {
  const timeZone = browserTimeZone();
  if (!timeZone) return;
  const key = `meritory.timeZone.${userId}`;
  if (readStored(key) === timeZone) return;
  const result = await saveTimeZone(timeZone);
  if (result.ok) writeStored(key, timeZone);
}

/** A recall day starts at 4 a.m. where the learner is, so the API needs their zone */
export function TimeZoneSync({ userId }: { userId: string }) {
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "visible") void syncTimeZone(userId);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [userId]);
  return null;
}
