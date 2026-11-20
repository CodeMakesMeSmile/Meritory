"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { startChapter } from "@/lib/recall-api";

/** Adds the chapter's cards to recall, then opens the sitting */
export function StartRecallButton({
  trackId,
  chapterId,
  signInPath,
}: {
  trackId: string;
  chapterId: string;
  signInPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setBusy(true);
    setFailed(false);
    const result = await startChapter(trackId, chapterId);
    if (result.ok) {
      router.push("/recall");
      return;
    }
    if (result.reason === "signed_out") {
      router.replace(`/sign-in?next=${encodeURIComponent(signInPath)}`);
      return;
    }
    setBusy(false);
    setFailed(true);
  }

  return (
    <div className="flex flex-col">
      <Button type="button" onClick={start} disabled={busy} className="w-full">
        Start recall
      </Button>
      {/* Kept in the page so the message is announced when it appears */}
      <p role="status" className="text-small text-danger">
        {failed ? (
          <span className="mt-2 block">
            Recall didn't start. Check your connection, then try again.
          </span>
        ) : null}
      </p>
    </div>
  );
}
