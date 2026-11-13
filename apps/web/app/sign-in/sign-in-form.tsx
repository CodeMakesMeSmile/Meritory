"use client";

import {
  EMAIL_ERROR,
  EMAIL_PATTERN,
  SIGN_IN_MESSAGES as MESSAGES,
  PASSWORD_REQUIRED,
  PROVIDER_LABELS,
  type ProviderNotice,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button, buttonClass, linkClass } from "@/components/button";
import { OrDivider, ProviderButtons } from "@/components/provider-buttons";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { useResend } from "@/lib/use-resend";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["email", "password"];

export function SignInForm({
  next,
  passwordSaved = false,
  accountDeleted = false,
  providerNotice = null,
}: {
  next: string;
  passwordSaved?: boolean;
  /** Just came from deleting the account */
  accountDeleted?: boolean;
  /** Why GitHub or Google sent them back */
  providerNotice?: ProviderNotice | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // The address that needs confirming, once the server says so
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const resend = useResend();
  const inputs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  function change(field: Field, value: string) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const found: Errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) found.email = EMAIL_ERROR;
    if (!password) found.password = PASSWORD_REQUIRED;
    setErrors(found);
    const first = FIELDS.find((field) => found[field]);
    if (first) {
      inputs[first].current?.focus();
      return;
    }

    if (!navigator.onLine) {
      setFormError(MESSAGES.offline);
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error } = await authClient.signIn.email(
        { email: email.trim(), password },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!error) {
        router.replace(next);
        return;
      }
      setPending(false);
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnconfirmed(email.trim());
        return;
      }
      setUnconfirmed(null);
      if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
        setFormError(MESSAGES.wrong);
      } else if (error.status === 429) {
        setFormError(waitMessage(retryAfter));
      } else {
        setFormError(MESSAGES.failed);
      }
    } catch {
      setPending(false);
      setFormError(MESSAGES.offline);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-display">Sign in</h1>
        <p className="flex items-center gap-1 text-small text-secondary">
          New to Meritory?
          <Link href="/sign-up" className={linkClass}>
            Create an account
          </Link>
        </p>
      </div>

      {formError && <Alert tone="danger">{formError}</Alert>}

      {providerNotice && !formError && !unconfirmed && (
        <>
          <Alert tone={providerNotice.tone}>{providerNotice.text}</Alert>
          {providerNotice.reset && (
            <Link href="/forgot-password" className={buttonClass("secondary")}>
              Reset password
            </Link>
          )}
        </>
      )}

      {passwordSaved && !formError && !unconfirmed && (
        <Alert tone="success">
          Password saved. Sign in with your new password.
        </Alert>
      )}

      {accountDeleted && !formError && !unconfirmed && (
        <Alert tone="success">
          Your account was deleted. We emailed you a confirmation.
        </Alert>
      )}

      {unconfirmed && (
        <>
          {resend.notice ? (
            <Alert tone={resend.notice.tone}>{resend.notice.text}</Alert>
          ) : (
            <Alert tone="info">{MESSAGES.unconfirmed}</Alert>
          )}
          <Button
            type="button"
            variant="secondary"
            waiting={resend.waiting}
            aria-busy={resend.pending}
            onClick={() => resend.send(unconfirmed)}
          >
            {resend.label}
          </Button>
        </>
      )}

      <ProviderButtons
        callbackURL={next}
        errorPage="/sign-in"
        disabled={pending}
        onLeave={() => setFormError(null)}
        onFailed={(provider) =>
          setFormError(
            `${PROVIDER_LABELS[provider]} sign-in didn't work. Try again.`,
          )
        }
      />
      <OrDivider />

      <TextField
        ref={inputs.email}
        id="email"
        type="email"
        label="Email"
        error={errors.email}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(event) => change("email", event.target.value)}
      />
      <TextField
        ref={inputs.password}
        id="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        error={errors.password}
        autoComplete="current-password"
        value={password}
        onChange={(event) => change("password", event.target.value)}
        aside={
          <Link href="/forgot-password" className={linkClass}>
            Forgot password?
          </Link>
        }
        trailing={
          <button
            type="button"
            className={linkClass}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
      />

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
