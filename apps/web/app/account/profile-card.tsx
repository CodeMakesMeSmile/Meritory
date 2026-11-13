"use client";

import {
  EMAIL_ERROR,
  EMAIL_PATTERN,
  NAME_ERROR,
  type Provider,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { listSessions, SESSION_ERRORS } from "@/lib/account-api";
import { authClient } from "@/lib/auth-client";
import { type EmailStep, sentNotice, stepNotice } from "@/lib/email-change";
import { savePendingEmail, takePendingEmail } from "@/lib/pending-action";
import { Card, Row } from "./card";
import { ConfirmItsYou } from "./confirm-its-you";

type Notice = { tone: "success" | "info" | "danger"; text: string };

const OFFLINE = "You're offline. This needs a connection.";
const FAILED = "Something went wrong on our side. Try again in a moment.";
const SAME_EMAIL = "That's already your email.";

interface ProfileCardProps {
  name: string;
  email: string;
  /** Set when the account has no password, for "Confirm it's you" */
  provider?: Provider | null;
  /** Back from a fresh provider sign-in, so a waiting change can finish */
  confirmed?: boolean;
  /** Where an emailed link left the change */
  step?: EmailStep | null;
}

export function ProfileCard({
  name,
  email,
  provider = null,
  confirmed = false,
  step = null,
}: ProfileCardProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(() =>
    step ? stepNotice(step, email) : null,
  );

  // Dropping ?email= keeps a refresh from saying it again
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("email")) return;
    url.searchParams.delete("email");
    url.searchParams.delete("error");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  function onSignedOut() {
    router.replace("/sign-in?next=/account");
  }

  return (
    <Card title="Profile">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <NameForm
        name={name}
        setNotice={setNotice}
        onSaved={() => router.refresh()}
        onSignedOut={onSignedOut}
      />
      <EmailRow
        email={email}
        provider={provider}
        confirmed={confirmed}
        setNotice={setNotice}
        onSignedOut={onSignedOut}
      />
    </Card>
  );
}

interface NameFormProps {
  name: string;
  setNotice: (notice: Notice | null) => void;
  onSaved: () => void;
  onSignedOut: () => void;
}

function NameForm({ name, setNotice, onSaved, onSignedOut }: NameFormProps) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function showError(text: string) {
    setError(text);
    input.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setNotice(null);
    const trimmed = value.trim();
    if (!trimmed) {
      showError(NAME_ERROR);
      return;
    }
    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error: failed } = await authClient.updateUser(
        { name: trimmed },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!failed) {
        setValue(trimmed);
        setNotice({ tone: "success", text: "Name saved." });
        // The rail and other pages read the name on the server
        onSaved();
      } else if (failed.code === "NAME_INVALID") {
        showError(failed.message ?? NAME_ERROR);
      } else if (failed.status === 401) {
        onSignedOut();
      } else if (failed.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else {
        setNotice({ tone: "danger", text: FAILED });
      }
    } catch {
      setNotice({ tone: "danger", text: OFFLINE });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="min-w-0 sm:flex-1">
        <TextField
          ref={input}
          id="name"
          label="What should we call you?"
          autoComplete="nickname"
          error={error}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(undefined);
          }}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full sm:mt-7 sm:w-50"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Saving" : "Save name"}
      </Button>
    </form>
  );
}

interface EmailRowProps {
  email: string;
  provider: Provider | null;
  confirmed: boolean;
  setNotice: (notice: Notice | null) => void;
  onSignedOut: () => void;
}

function EmailRow({
  email,
  provider,
  confirmed,
  setNotice,
  onSignedOut,
}: EmailRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [askConfirm, setAskConfirm] = useState(false);
  const [signedInAt, setSignedInAt] = useState<Date | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Taken once on arrival, so a saved change never sends twice or after a cancel
  useEffect(() => {
    const saved = takePendingEmail();
    if (!confirmed || !saved) return;
    setEditing(true);
    setValue(saved);
    void send(saved);
  }, []);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  function showError(text: string) {
    setError(text);
    input.current?.focus();
  }

  function toggle() {
    setEditing((now) => !now);
    setValue("");
    setError(undefined);
  }

  async function confirmFirst() {
    const list = await listSessions();
    const current = list.ok
      ? list.data.sessions.find((session) => session.current)
      : undefined;
    setSignedInAt(current ? new Date(current.signedInAt) : null);
    setAskConfirm(true);
  }

  async function send(address: string) {
    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error: failed } = await authClient.changeEmail(
        { newEmail: address, callbackURL: "/account" },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!failed) {
        setEditing(false);
        setValue("");
        setNotice(sentNotice(email));
      } else if (failed.code === SESSION_ERRORS.confirmPassword) {
        await confirmFirst();
      } else if (failed.code === "SAME_EMAIL") {
        showError(SAME_EMAIL);
      } else if (failed.status === 401) {
        onSignedOut();
      } else if (failed.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else if (failed.status === 400) {
        showError(EMAIL_ERROR);
      } else {
        setNotice({ tone: "danger", text: FAILED });
      }
    } catch {
      setNotice({ tone: "danger", text: OFFLINE });
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setNotice(null);
    const address = value.trim();
    if (!EMAIL_PATTERN.test(address)) {
      showError(EMAIL_ERROR);
      return;
    }
    if (address.toLowerCase() === email.toLowerCase()) {
      showError(SAME_EMAIL);
      return;
    }
    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }
    await send(address);
  }

  return (
    <Row className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-small font-semibold">Email</p>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-body break-all">{email}</span>
            <span className="text-small text-success">Verified</span>
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-50"
          aria-expanded={editing}
          aria-controls="new-email-form"
          onClick={toggle}
        >
          {editing ? "Cancel" : "Change email"}
        </Button>
      </div>
      {editing && (
        <form
          id="new-email-form"
          noValidate
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 sm:flex-1">
              <TextField
                ref={input}
                id="new-email"
                type="email"
                label="New email"
                autoComplete="email"
                error={error}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(undefined);
                }}
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:mt-7 sm:w-50"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Sending" : "Send approval link"}
            </Button>
          </div>
          <p className="text-small text-secondary">
            We'll email {email} to approve the change, then send a link to the
            new address. Your email changes once both are opened.
          </p>
        </form>
      )}
      <ConfirmItsYou
        open={askConfirm}
        provider={provider}
        signedInAt={signedInAt}
        onLeave={() => savePendingEmail(value.trim())}
        onCancel={() => setAskConfirm(false)}
        onConfirmed={() => {
          setAskConfirm(false);
          void send(value.trim());
        }}
      />
    </Row>
  );
}
