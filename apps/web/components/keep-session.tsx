"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

/** Server-rendered pages can't pass a new cookie on, so the browser asks for it */
export function KeepSession() {
  useEffect(() => {
    // A miss only waits for the next page
    authClient.getSession().catch(() => {});
  }, []);
  return null;
}
