"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { type ConfirmKind, confirmEmail } from "@/lib/confirm-email";

export function ConfirmForm({
  token,
  kind,
}: {
  token: string;
  kind: ConfirmKind;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirm() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const outcome = await confirmEmail(token, kind);
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
        onClick={() => void confirm()}
      >
        {pending ? "Confirming" : "Confirm email"}
      </Button>
    </div>
  );
}
