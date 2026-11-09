"use client";

import {
  MISMATCH,
  meterMessage,
  PASSWORD_CODES,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import type { PasswordCheck } from "@meritory/password";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button, linkClass } from "@/components/button";
import { ShowButton } from "@/components/show-button";
import { StrengthMeter } from "@/components/strength-meter";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { loadPasswordRules } from "@/lib/password-rules";
import { PROVIDER_LABELS, type Provider } from "@/lib/providers";
import { Card, Row } from "./card";

type Field = "current" | "password" | "confirm";
type Errors = Partial<Record<Field, string>>;
type Notice = { tone: "success" | "danger"; text: string };

const FIELDS: Field[] = ["current", "password", "confirm"];
const OFFLINE = "You're offline. Changing your password needs a connection.";

interface PasswordCardProps {
  /** Lets the meter catch a password with the name or email in it */
  name: string;
  email: string;
  /** Set when the account has no password yet */
  provider?: Provider | null;
  /** Other sessions just ended, so the list is out of date */
  onChanged: () => void;
}

export function PasswordCard({
  name,
  email,
  provider = null,
  onChanged,
}: PasswordCardProps) {
  const [values, setValues] = useState<Record<Field, string>>({
    current: "",
    password: "",
    confirm: "",
  });
  const [shown, setShown] = useState<Record<Field, boolean>>({
    current: false,
    password: false,
    confirm: false,
  });
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [strengthMessages, setStrengthMessages] = useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = {
    current: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
  };

  function update(field: Field, value: string) {
    setValues((now) => ({ ...now, [field]: value }));
    setErrors((now) => ({ ...now, [field]: undefined }));
  }

  async function changeNew(value: string) {
    update("password", value);
    if (!value) {
      setCheck(null);
      return;
    }
    const rules = await loadPasswordRules();
    setStrengthMessages(rules.STRENGTH_MESSAGES);
    setCheck(rules.checkPassword(value, { name, email }));
  }

  function showErrors(found: Errors) {
    setErrors(found);
    const first = FIELDS.find((field) => found[field]);
    if (first) inputs[first].current?.focus();
    return first !== undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setNotice(null);

    const result = (await loadPasswordRules()).checkPassword(values.password, {
      name,
      email,
    });
    const found: Errors = {};
    if (!values.current) found.current = "Enter your current password.";
    if (result.problem) found.password = result.message;
    else if (values.confirm !== values.password) found.confirm = MISMATCH;
    if (showErrors(found)) return;

    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error } = await authClient.changePassword(
        {
          currentPassword: values.current,
          newPassword: values.password,
          // The server ends them either way
          revokeOtherSessions: true,
        },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      setPending(false);
      if (!error) {
        setValues({ current: "", password: "", confirm: "" });
        setCheck(null);
        setNotice({
          tone: "success",
          text: "Password changed. Your other devices were signed out.",
        });
        onChanged();
      } else if (error.code === "INVALID_PASSWORD") {
        // The new password stays, so it isn't typed twice more
        showErrors({ current: "That isn't your current password." });
      } else if (error.code && PASSWORD_CODES.has(error.code)) {
        showErrors({ password: error.message });
      } else if (error.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else {
        setNotice({
          tone: "danger",
          text: "Something went wrong on our side. Try again in a moment.",
        });
      }
    } catch {
      setPending(false);
      setNotice({ tone: "danger", text: OFFLINE });
    }
  }

  const toggle = (field: Field) =>
    setShown((now) => ({ ...now, [field]: !now[field] }));

  if (provider) return <NoPasswordCard email={email} provider={provider} />;

  return (
    <Card
      title="Password"
      description="Changing it signs you out on your other devices."
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        <TextField
          ref={inputs.current}
          id="current-password"
          type={shown.current ? "text" : "password"}
          label="Current password"
          autoComplete="current-password"
          error={errors.current}
          value={values.current}
          onChange={(event) => update("current", event.target.value)}
          aside={
            <Link href="/forgot-password" className={linkClass}>
              Forgot password?
            </Link>
          }
          trailing={
            <ShowButton
              shown={shown.current}
              what="current password"
              onToggle={() => toggle("current")}
            />
          }
        />
        <TextField
          ref={inputs.password}
          id="new-password"
          type={shown.password ? "text" : "password"}
          label="New password"
          helper="At least 16 characters. A few unrelated words works well."
          autoComplete="new-password"
          error={errors.password}
          value={values.password}
          onChange={(event) => void changeNew(event.target.value)}
          trailing={
            <ShowButton
              shown={shown.password}
              what="new password"
              onToggle={() => toggle("password")}
            />
          }
          below={
            <StrengthMeter
              strength={check?.strength ?? null}
              message={meterMessage(check, strengthMessages)}
            />
          }
        />
        <TextField
          ref={inputs.confirm}
          id="confirm-password"
          type={shown.confirm ? "text" : "password"}
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirm}
          value={values.confirm}
          onChange={(event) => update("confirm", event.target.value)}
          trailing={
            <ShowButton
              shown={shown.confirm}
              what="confirmed password"
              onToggle={() => toggle("confirm")}
            />
          }
        />
        <Row className="flex justify-end">
          <Button
            type="submit"
            className="w-full sm:w-50"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Saving" : "Change password"}
          </Button>
        </Row>
      </form>
    </Card>
  );
}

/** Someone who signs in with GitHub or Google sets a password by email */
function NoPasswordCard({
  email,
  provider,
}: {
  email: string;
  provider: Provider;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);

  async function send() {
    if (pending) return;
    setNotice(null);
    if (!navigator.onLine) {
      setNotice({
        tone: "danger",
        text: "You're offline. Sending a link needs a connection.",
      });
      return;
    }
    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error } = await authClient.requestPasswordReset(
        { email, redirectTo: "/reset-password" },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!error) {
        setNotice({
          tone: "success",
          text: `We sent a link to ${email}. It works for 1 hour.`,
        });
      } else if (error.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else {
        setNotice({
          tone: "danger",
          text: "Something went wrong on our side. Try again in a moment.",
        });
      }
    } catch {
      setNotice({
        tone: "danger",
        text: "You're offline. Sending a link needs a connection.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Password" description="No password set.">
      <p className="text-small text-secondary">
        You sign in with {PROVIDER_LABELS[provider]}, so there's no password
        yet. We can email you a link to set one.
      </p>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Row className="flex justify-end">
        <Button
          type="button"
          className="w-full sm:w-50"
          disabled={pending}
          aria-busy={pending}
          onClick={() => void send()}
        >
          {pending ? "Sending" : "Email me a link"}
        </Button>
      </Row>
    </Card>
  );
}
