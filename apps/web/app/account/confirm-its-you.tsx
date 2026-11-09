"use client";

import { waitMessage } from "@meritory/contracts/sign-in-messages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button, linkClass } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { ProviderButtons } from "@/components/provider-buttons";
import { ShowButton } from "@/components/show-button";
import { TextField } from "@/components/text-field";
import { confirmPassword } from "@/lib/account-api";
import { daysAgo } from "@/lib/activity";
import { PROVIDER_LABELS, type Provider } from "@/lib/providers";

interface ConfirmItsYouProps {
  open: boolean;
  /** When this session signed in, to say how long ago */
  signedInAt: Date | null;
  /** Set when the account has no password, so signing in again stands in for it */
  provider?: Provider | null;
  /** Saves the waiting action before the page leaves for the provider */
  onLeave?: () => void;
  onCancel: () => void;
  onConfirmed: () => void;
}

/** Asks for the password, or a fresh provider sign-in, when the sign-in is over a day old */
export function ConfirmItsYou({
  open,
  signedInAt,
  provider = null,
  onLeave,
  onCancel,
  onConfirmed,
}: ConfirmItsYouProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function close() {
    setPassword("");
    setError(undefined);
    setFormError(null);
    onCancel();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    if (!password) {
      setError("Enter your password.");
      input.current?.focus();
      return;
    }

    setPending(true);
    const result = await confirmPassword(password);
    setPending(false);
    if (result.ok) {
      setPassword("");
      onConfirmed();
      return;
    }
    if (result.reason === "wrong_password") {
      setError("That isn't your password.");
      input.current?.focus();
    } else if (result.reason === "rate_limited") {
      setFormError(waitMessage(result.retryAfter));
    } else if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/account");
    } else {
      setFormError(
        "Something went wrong. Check your connection and try again.",
      );
    }
  }

  const when = signedInAt ? daysAgo(signedInAt) : "over a day ago";

  if (provider) {
    const label = PROVIDER_LABELS[provider];
    return (
      <Dialog open={open} title="Confirm it's you" onClose={close}>
        <p className="text-small text-secondary">
          You last signed in {when}. Sign in with {label} again to keep going.
        </p>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <ProviderButtons
            providers={[provider]}
            callbackURL="/account?confirmed=1"
            errorPage="/account"
            onLeave={onLeave}
            onFailed={() =>
              setFormError(
                "Something went wrong. Check your connection and try again.",
              )
            }
          />
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} title="Confirm it's you" onClose={close}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-small text-secondary">
          You last signed in {when}. Enter your password to keep going.
        </p>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <TextField
          ref={input}
          id="confirm-its-you"
          type={shown ? "text" : "password"}
          label="Password"
          autoComplete="current-password"
          error={error}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(undefined);
          }}
          aside={
            <Link href="/forgot-password" className={linkClass}>
              Forgot password?
            </Link>
          }
          trailing={
            <ShowButton
              shown={shown}
              what="password"
              onToggle={() => setShown((now) => !now)}
            />
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Checking" : "Continue"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
