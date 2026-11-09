"use client";

import type { SignInMethods } from "@meritory/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import {
  listSessions,
  SESSION_ERRORS,
  unlinkProvider,
} from "@/lib/account-api";
import { shortDate } from "@/lib/activity";
import { authClient } from "@/lib/auth-client";
import {
  type MethodAction,
  savePendingMethod,
  takePendingMethod,
} from "@/lib/pending-action";
import {
  PROVIDER_LABELS,
  type Provider,
  type ProviderNotice,
} from "@/lib/providers";
import { Card, Row } from "./card";
import { ConfirmItsYou } from "./confirm-its-you";

const subscribe = () => () => {};

// False on the server, whose time zone could show the wrong day
function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Why Unlink is off, and what would turn it on */
export function onlyWayText(label: string, canLink: string[]) {
  const fix = canLink[0]
    ? `Link ${canLink[0]} or set a password`
    : "Set a password";
  return `${label} is your only way to sign in. ${fix} before unlinking it.`;
}

/** What still signs them in once this provider is gone */
export function stillWorksText(hasPassword: boolean, otherLinked: string[]) {
  const [other] = otherLinked;
  if (hasPassword && other) {
    return `${other} and your email and password still work.`;
  }
  return `${other ?? "Email and password"} still works.`;
}

type Message = Omit<ProviderNotice, "tone"> & {
  tone: ProviderNotice["tone"] | "success";
};

interface MethodsCardProps {
  methods: SignInMethods;
  /** What GitHub or Google sent them back with */
  notice: ProviderNotice | null;
  /** Set when the account has no password, for "Confirm it's you" */
  provider: Provider | null;
  /** Back from a fresh provider sign-in, so a waiting action can finish */
  confirmed: boolean;
}

export function MethodsCard({
  methods,
  notice,
  provider,
  confirmed,
}: MethodsCardProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [message, setMessage] = useState<Message | null>(notice);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [askUnlink, setAskUnlink] = useState<Provider | null>(null);
  const [retry, setRetry] = useState<MethodAction | null>(null);
  const [signedInAt, setSignedInAt] = useState<Date | null>(null);

  // Taken once on arrival, so a saved action never runs twice or after a cancel
  useEffect(() => {
    const saved = takePendingMethod();
    if (confirmed && saved) void run(saved);
  }, []);

  const linkedIds = methods.providers.map(({ id }) => id);
  const shown = (["github", "google"] as const).filter(
    (id) => methods.available.includes(id) || linkedIds.includes(id),
  );
  const onlyOne = linkedIds.length + (methods.passwordSetAt ? 1 : 0) === 1;
  const day = (iso: string) => (hydrated ? ` ${shortDate(new Date(iso))}` : "");

  async function askConfirm(action: MethodAction) {
    const list = await listSessions();
    const current = list.ok
      ? list.data.sessions.find((session) => session.current)
      : undefined;
    setSignedInAt(current ? new Date(current.signedInAt) : null);
    setRetry(action);
  }

  async function link(action: MethodAction) {
    const label = PROVIDER_LABELS[action.provider];
    try {
      const { error } = await authClient.linkSocial({
        provider: action.provider,
        callbackURL: "/account",
        errorCallbackURL: "/account",
      });
      // Better Auth is already on its way to the provider
      if (!error) return;
      setBusy(null);
      if (error.code === SESSION_ERRORS.confirmPassword) {
        await askConfirm(action);
        return;
      }
      if (error.status === 401) {
        router.replace("/sign-in?next=/account");
        return;
      }
    } catch {
      setBusy(null);
    }
    setMessage({
      tone: "danger",
      text: `We couldn't open ${label}. Check your connection and try again.`,
    });
  }

  async function unlink(action: MethodAction) {
    const label = PROVIDER_LABELS[action.provider];
    const result = await unlinkProvider(action.provider);
    setBusy(null);
    if (result.ok) {
      setMessage({
        tone: "success",
        text: `${label} is no longer linked. To sign out your other devices, use Sign out from all below.`,
      });
      router.refresh();
    } else if (result.reason === "gone" || result.reason === "last_method") {
      // Something else changed the account, so show what's true now
      router.refresh();
    } else if (result.reason === "confirm_password") {
      await askConfirm(action);
    } else if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/account");
    } else {
      setMessage({
        tone: "danger",
        text: `We couldn't unlink ${label}. Check your connection and try again.`,
      });
    }
  }

  async function run(action: MethodAction) {
    setMessage(null);
    setBusy(action.provider);
    await (action.kind === "link" ? link(action) : unlink(action));
  }

  const askingLabel = askUnlink ? PROVIDER_LABELS[askUnlink] : "";

  return (
    <Card
      title="Sign-in methods"
      description="Any of these can sign you in. Keep at least one."
    >
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Row className="flex min-h-11 flex-col justify-center gap-0.5">
        <span className="text-body">Email and password</span>
        <span className="text-small text-secondary">
          {methods.passwordSetAt
            ? `Password set${day(methods.passwordSetAt)} · change it below`
            : "No password yet · set one below"}
        </span>
      </Row>
      {shown.map((id) => {
        const label = PROVIDER_LABELS[id];
        const linked = methods.providers.find((row) => row.id === id);
        const working = busy === id;
        return (
          <Row key={id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body">{label}</span>
                <span className="text-small text-secondary">
                  {linked ? `Linked${day(linked.linkedAt)}` : "Not linked"}
                </span>
              </div>
              {linked ? (
                <Button
                  variant="secondary"
                  className="w-full sm:w-50"
                  disabled={busy !== null}
                  waiting={working || onlyOne}
                  aria-busy={working}
                  aria-label={`Unlink ${label}`}
                  aria-describedby={onlyOne ? `only-${id}` : undefined}
                  onClick={() => {
                    if (!onlyOne) setAskUnlink(id);
                  }}
                >
                  {working ? "Unlinking" : "Unlink"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full sm:w-50"
                  disabled={busy !== null}
                  waiting={working}
                  aria-busy={working}
                  onClick={() => void run({ kind: "link", provider: id })}
                >
                  {working ? `Opening ${label}` : `Link ${label}`}
                </Button>
              )}
            </div>
            {linked && onlyOne && (
              <p id={`only-${id}`} className="text-small text-secondary">
                {onlyWayText(
                  label,
                  shown
                    .filter((other) => !linkedIds.includes(other))
                    .map((other) => PROVIDER_LABELS[other]),
                )}
              </p>
            )}
          </Row>
        );
      })}

      <Dialog
        open={askUnlink !== null}
        title={`Unlink ${askingLabel}?`}
        onClose={() => setAskUnlink(null)}
      >
        <p className="text-small text-secondary">
          You won't be able to sign in with {askingLabel}.{" "}
          {stillWorksText(
            methods.passwordSetAt !== null,
            linkedIds
              .filter((id) => id !== askUnlink)
              .map((id) => PROVIDER_LABELS[id]),
          )}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setAskUnlink(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const target = askUnlink;
              setAskUnlink(null);
              if (target) void run({ kind: "unlink", provider: target });
            }}
          >
            Unlink {askingLabel}
          </Button>
        </div>
      </Dialog>

      <ConfirmItsYou
        open={retry !== null}
        provider={provider}
        onLeave={() => {
          if (retry) savePendingMethod(retry);
        }}
        signedInAt={signedInAt}
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
