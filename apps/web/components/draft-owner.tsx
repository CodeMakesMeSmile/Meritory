"use client";

import { useEffect } from "react";
import { claimDrafts } from "@/lib/device-storage";

/** Sits before the page, so another account's drafts are gone before anything reads them */
export function DraftOwner({ userId }: { userId: string }) {
  useEffect(() => claimDrafts(userId), [userId]);
  return null;
}
