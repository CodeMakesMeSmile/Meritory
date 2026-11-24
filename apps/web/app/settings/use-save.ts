"use client";

import { SAVE_FAILED, SAVE_OFFLINE } from "@meritory/recall-client";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  type SettingProblem,
  type SettingsBody,
  type SettingsResponse,
  saveSettings,
} from "@/lib/recall-api";

function listen(change: () => void) {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => {
    window.removeEventListener("online", change);
    window.removeEventListener("offline", change);
  };
}

/** Whether the browser has a connection, taken as yes before it can tell */
export function useOnline(): boolean {
  return useSyncExternalStore(
    listen,
    () => navigator.onLine,
    () => true,
  );
}

export type Notice = { tone: "success" | "danger"; text: string } | null;

/** Each refused setting's message, by its path */
export type FieldErrors = Record<string, string>;

/**
 * Saves one card's settings. A refusal keeps what was typed and marks each
 * field, and anything that changed for good goes up through onSaved.
 */
export function useSave(onSaved: (data: SettingsResponse) => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function save(
    change: SettingsBody,
    savedLine: (data: SettingsResponse) => string,
  ): Promise<boolean> {
    setNotice(null);
    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: SAVE_OFFLINE });
      return false;
    }
    setPending(true);
    const result = await saveSettings(change);
    setPending(false);
    if (result.ok) {
      setErrors({});
      onSaved(result.data);
      setNotice({ tone: "success", text: savedLine(result.data) });
      return true;
    }
    if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/settings");
      return false;
    }
    if (result.problems?.length) {
      setErrors(byField(result.problems));
      return false;
    }
    setNotice({ tone: "danger", text: SAVE_FAILED });
    return false;
  }

  return {
    save,
    pending,
    notice,
    errors,
    setErrors,
    clear: () => {
      setNotice(null);
      setErrors({});
    },
  };
}

function byField(problems: SettingProblem[]): FieldErrors {
  return Object.fromEntries(problems.map((p) => [p.field, p.message]));
}
