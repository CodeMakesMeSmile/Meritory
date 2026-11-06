"use client";

import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { EMAIL_ERROR, EMAIL_PATTERN } from "@/lib/email";
import { useSignUpEmail } from "@/lib/sign-up-email";
import { useResend } from "@/lib/use-resend";

export function ExpiredLinkForm() {
  // Filled in when this tab just signed up, until the person types
  const stored = useSignUpEmail();
  const [typed, setTyped] = useState<string | null>(null);
  const email = typed ?? stored ?? "";
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const resend = useResend();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(EMAIL_ERROR);
      input.current?.focus();
      return;
    }
    void resend.send(email.trim());
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {resend.notice && (
        <Alert tone={resend.notice.tone}>{resend.notice.text}</Alert>
      )}
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
          setTyped(event.target.value);
          setError(undefined);
        }}
      />
      <Button
        type="submit"
        className="w-full"
        waiting={resend.waiting}
        aria-busy={resend.pending}
      >
        {resend.label}
      </Button>
    </form>
  );
}
