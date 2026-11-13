"use client";

import {
  type Provider,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { deleteAccount, listSessions } from "@/lib/account-api";
import { ACCOUNT_DELETED_URL } from "@/lib/password-saved";
import { savePendingDelete, takePendingDelete } from "@/lib/pending-action";
import { Card, Row } from "./card";
import { ConfirmItsYou } from "./confirm-its-you";

const FAILED =
  "Your account wasn't deleted, and nothing was removed. Try again in a minute.";

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Names what goes, so nothing is removed by surprise */
export function deleteText(sessions: number | null, methods: number) {
  const ended =
    sessions === null ? "sessions" : count(sessions, "session", "sessions");
  const unlinked = count(methods, "sign-in method", "sign-in methods");
  return `Your practice history, ${ended}, and ${unlinked} will be removed for good. This can't be undone.`;
}

interface DeleteCardProps {
  /** Password plus linked providers, for the dialog's count */
  methods: number;
  /** Set when the account has no password, for "Confirm it's you" */
  provider?: Provider | null;
  /** Back from a fresh provider sign-in, so a waiting deletion can be asked again */
  confirmed?: boolean;
}

export function DeleteCard({
  methods,
  provider = null,
  confirmed = false,
}: DeleteCardProps) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [askConfirm, setAskConfirm] = useState(false);
  const [sessions, setSessions] = useState<number | null>(null);
  const [signedInAt, setSignedInAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function open() {
    setError(null);
    setAsk(true);
    const list = await listSessions();
    if (!list.ok) return;
    setSessions(list.data.sessions.length);
    const current = list.data.sessions.find((session) => session.current);
    setSignedInAt(current ? new Date(current.signedInAt) : null);
  }

  // Taken once on arrival, and asked again rather than run, since it can't be undone
  useEffect(() => {
    const saved = takePendingDelete();
    if (confirmed && saved) void open();
  }, []);

  async function run() {
    setAsk(false);
    setPending(true);
    const result = await deleteAccount();
    if (result.ok) {
      // A full load, so nothing from the deleted account stays in memory
      window.location.replace(ACCOUNT_DELETED_URL);
      return;
    }
    setPending(false);
    if (result.reason === "confirm_password") {
      setAskConfirm(true);
    } else if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/account");
    } else if (result.reason === "rate_limited") {
      setError(waitMessage(result.retryAfter));
    } else {
      setError(FAILED);
    }
  }

  return (
    <Card
      title="Delete account"
      description="This removes your practice history, sessions, and sign-in methods. It can't be undone."
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Row className="flex justify-end">
        <Button
          variant="danger"
          className="w-full sm:w-50"
          disabled={pending}
          aria-busy={pending}
          onClick={() => void open()}
        >
          {pending ? "Deleting" : "Delete account"}
        </Button>
      </Row>

      <Dialog
        open={ask}
        title="Delete your account?"
        onClose={() => setAsk(false)}
      >
        <p className="text-small text-secondary">
          {deleteText(sessions, methods)}
        </p>
        {/* Stacked on phones, where "Delete my account" won't fit half the width */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => setAsk(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void run()}>
            Delete my account
          </Button>
        </div>
      </Dialog>

      <ConfirmItsYou
        open={askConfirm}
        provider={provider}
        signedInAt={signedInAt}
        onLeave={savePendingDelete}
        onCancel={() => setAskConfirm(false)}
        onConfirmed={() => {
          setAskConfirm(false);
          void run();
        }}
      />
    </Card>
  );
}
