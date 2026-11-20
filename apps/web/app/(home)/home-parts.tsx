"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/button";
import { readStoppedAt, type StoppedAt } from "@/lib/device-storage";

/** Today's date in the browser's own time zone, filled in after load */
export function LocalDate() {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    );
  }, []);
  return <p className="min-h-5 text-small text-secondary">{text}</p>;
}

function useStoppedAt() {
  const [stopped, setStopped] = useState<StoppedAt | null>(null);
  useEffect(() => setStopped(readStoppedAt()), []);
  return stopped;
}

/** Start recall, or Continue recall after Stop for now in this tab */
export function RecallButton() {
  const stopped = useStoppedAt();
  return (
    <Link href="/recall" className={`${buttonClass()} w-full sm:w-50`}>
      {stopped ? "Continue recall" : "Start recall"}
    </Link>
  );
}

/** The note under the queue, which says where a stopped sitting left off */
export function QueueNote({ fallback }: { fallback: string }) {
  const stopped = useStoppedAt();
  return (
    <p className="text-small text-secondary">
      {stopped
        ? `You stopped at ${stopped.done} of ${stopped.total}. Your answers so far are saved.`
        : fallback}
    </p>
  );
}
