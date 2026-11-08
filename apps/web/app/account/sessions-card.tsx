"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import {
  type AccountSession,
  endOtherSessions,
  endSession,
  listSessions,
} from "@/lib/account-api";
import { activeText, listNames, signedInText } from "@/lib/activity";
import {
  type SessionAction,
  savePendingAction,
  takePendingAction,
} from "@/lib/pending-action";
import type { Provider } from "@/lib/providers";
import { Card, Row } from "./card";
import { ConfirmItsYou } from "./confirm-its-you";

type Action = SessionAction;

const LOAD_FAILED =
  "We couldn't load your sessions. Check your connection and try again.";
const END_FAILED =
  "We couldn't sign that session out. Check your connection and try again.";

/** Who has to sign in again, so nothing ends by surprise */
export function othersText(others: AccountSession[]) {
  const names = others.map((session) => session.device);
  const unique = new Set(names);
  const who =
    unique.size === names.length && names.length <= 3
      ? listNames(names)
      : `Your ${names.length} other sessions`;
  return `${who} will need to sign in again. This device stays signed in.`;
}

interface SessionsCardProps {
  /** Set when the account has no password, for "Confirm it's you" */
  provider?: Provider | null;
  /** Back from a fresh provider sign-in, so a waiting sign-out can finish */
  confirmed?: boolean;
}

export function SessionsCard({
  provider = null,
  confirmed = false,
}: SessionsCardProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<AccountSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState<string | null>(null);
  const [askAll, setAskAll] = useState(false);
  const [retry, setRetry] = useState<Action | null>(null);

  const toSignIn = useCallback(
    () => router.replace("/sign-in?next=/account"),
    [router],
  );

  const load = useCallback(async () => {
    const result = await listSessions();
    if (result.ok) {
      setSessions(result.data.sessions);
      return;
    }
    if (result.reason === "signed_out") toSignIn();
    else setError(LOAD_FAILED);
  }, [toSignIn]);

  useEffect(() => {
    void load();
  }, [load]);

  // Taken once on arrival, so a saved sign-out never runs twice or after a cancel
  useEffect(() => {
    const saved = takePendingAction();
    if (!confirmed) return;
    window.history.replaceState(null, "", "/account");
    if (saved) void run(saved);
    // Only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: Action) {
    setError(null);
    setEnding(action.kind === "one" ? action.id : "others");
    const result =
      action.kind === "one"
        ? await endSession(action.id)
        : await endOtherSessions();
    setEnding(null);
    // A session that's already gone is the outcome they wanted
    if (result.ok || result.reason === "gone") {
      await load();
    } else if (result.reason === "confirm_password") {
      setRetry(action);
    } else if (result.reason === "signed_out") {
      toSignIn();
    } else {
      setError(END_FAILED);
    }
  }

  const current = sessions?.find((session) => session.current) ?? null;
  const others = sessions?.filter((session) => !session.current) ?? [];

  return (
    <Card title="Sessions" description="Where you're signed in right now.">
      {error && <Alert tone="danger">{error}</Alert>}
      {sessions === null && !error && (
        <Row>
          <p className="text-small text-secondary">Loading your sessions</p>
        </Row>
      )}
      {sessions?.map((session) => (
        <Row
          key={session.id}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-body">{session.device}</span>
              {session.current && (
                <span className="border border-border px-1.5 font-mono text-tag uppercase">
                  This device
                </span>
              )}
            </div>
            <span className="text-small text-secondary">
              {activeText(new Date(session.lastActiveAt), session.current)} ·{" "}
              {signedInText(new Date(session.signedInAt))}
            </span>
          </div>
          {!session.current && (
            <Button
              variant="secondary"
              className="w-full sm:w-50"
              disabled={ending !== null}
              waiting={ending === session.id}
              aria-busy={ending === session.id}
              aria-label={`Sign out ${session.device}`}
              onClick={() => void run({ kind: "one", id: session.id })}
            >
              {ending === session.id ? "Signing out" : "Sign out"}
            </Button>
          )}
        </Row>
      ))}
      {sessions !== null && others.length === 0 && (
        <p className="text-small text-secondary">You're only signed in here.</p>
      )}
      {others.length > 0 && (
        <Row className="flex justify-end">
          <Button
            variant="secondary"
            className="w-full sm:w-50"
            disabled={ending !== null}
            waiting={ending === "others"}
            aria-busy={ending === "others"}
            onClick={() => setAskAll(true)}
          >
            {ending === "others" ? "Signing out" : "Sign out from all"}
          </Button>
        </Row>
      )}

      <Dialog
        open={askAll}
        title="Sign out from all other devices?"
        onClose={() => setAskAll(false)}
      >
        <p className="text-small text-secondary">{othersText(others)}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setAskAll(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setAskAll(false);
              void run({ kind: "others" });
            }}
          >
            Sign out from all
          </Button>
        </div>
      </Dialog>

      <ConfirmItsYou
        open={retry !== null}
        provider={provider}
        onLeave={() => {
          if (retry) savePendingAction(retry);
        }}
        signedInAt={current ? new Date(current.signedInAt) : null}
        onCancel={() => setRetry(null)}
        onConfirmed={() => {
          const action = retry;
          setRetry(null);
          if (action) void run(action);
        }}
      />
    </Card>
  );
}
