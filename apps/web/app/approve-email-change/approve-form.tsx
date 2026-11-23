"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { approveEmailChange } from "@/lib/email-change";

export function ApproveForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const outcome = await approveEmailChange(token);
    if ("next" in outcome) {
      router.replace(outcome.next);
      return;
    }
    setPending(false);
    setMessage(outcome.message);
  }

  return (
    <div className="flex flex-col gap-5">
      {message && <Alert tone="danger">{message}</Alert>}
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void approve()}
      >
        {pending ? "Approving" : "Approve"}
      </Button>
    </div>
  );
}
