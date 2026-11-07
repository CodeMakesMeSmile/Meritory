"use client";

import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { EMAIL_ERROR, EMAIL_PATTERN } from "@/lib/email";
import { waitMessage } from "@/lib/wait-message";

type Notice = { tone: "info" | "danger"; text: string };

const NOTICES = {
  // The same whether or not the email has an account
  sent: {
    tone: "info",
    text: "If that email has an account, we sent a link. It works for 1 hour.",
  },
  offline: {
    tone: "danger",
    text: "You're offline. Sending a link needs a connection.",
  },
  failed: {
    tone: "danger",
    text: "Something went wrong on our side. Try again in a moment.",
  },
} satisfies Record<string, Notice>;

/** Asks for a reset link. Used by forgot password and by an expired reset link. */
export function ForgotPasswordForm({ submitLabel }: { submitLabel: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(EMAIL_ERROR);
      input.current?.focus();
      return;
    }
    if (!navigator.onLine) {
      setNotice(NOTICES.offline);
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error: failure } = await authClient.requestPasswordReset(
        { email: email.trim(), redirectTo: "/reset-password" },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!failure) setNotice(NOTICES.sent);
      else if (failure.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else setNotice(NOTICES.failed);
    } catch {
      setNotice(NOTICES.offline);
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <TextField
        ref={input}
        id="email"
        type="email"
        label="Email"
        error={error}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(undefined);
        }}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Sending link" : submitLabel}
      </Button>
    </form>
  );
}
