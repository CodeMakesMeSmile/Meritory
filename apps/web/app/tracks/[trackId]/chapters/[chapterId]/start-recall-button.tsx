"use client";

import { waitMessage } from "@meritory/contracts/sign-in-messages";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { startChapter } from "@/lib/recall-api";

/** Adds the chapter's cards to recall, then opens the sitting */
export function StartRecallButton({
  trackId,
  chapterId,
  signInPath,
  className = "w-full",
}: {
  trackId: string;
  chapterId: string;
  signInPath: string;
  /** The button's width and place, which differ beside the text and under it */
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setFailed(null);
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
    setFailed(
      result.code === "rate_limited"
        ? waitMessage(null)
        : "Check your connection, then try again.",
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        onClick={start}
        disabled={busy}
        className={className}
      >
        Start recall
      </Button>
      {/* Kept in the page so the message is announced when it appears */}
      <div role="status">
        {failed && (
          <div className="flex flex-col gap-1 border border-danger bg-card p-4">
            <p className="text-small font-semibold text-danger">
              Recall didn't start
            </p>
            <p className="text-small">{failed}</p>
          </div>
        )}
      </div>
    </div>
  );
}
