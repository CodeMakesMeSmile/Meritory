"use client";

import type { PasswordCheck } from "@meritory/password";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { ShowButton } from "@/components/show-button";
import { StrengthMeter } from "@/components/strength-meter";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import {
  loadPasswordRules,
  MISMATCH,
  meterMessage,
  PASSWORD_CODES,
} from "@/lib/password-rules";
import { PASSWORD_SAVED_URL } from "@/lib/password-saved";
import { waitMessage } from "@/lib/wait-message";

type Field = "password" | "confirm";
type Errors = Partial<Record<Field, string>>;

/** Where an expired, used, or cancelled link ends up */
export const EXPIRED_URL = "/reset-password?error=INVALID_TOKEN";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [shown, setShown] = useState({ password: false, confirm: false });
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [strengthMessages, setStrengthMessages] = useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = {
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
  };

  async function changePassword(value: string) {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
    if (!value) {
      setCheck(null);
      return;
    }
    const rules = await loadPasswordRules();
    setStrengthMessages(rules.STRENGTH_MESSAGES);
    setCheck(rules.checkPassword(value, {}));
  }

  function showErrors(found: Errors) {
    setErrors(found);
    const first = (["password", "confirm"] as const).find((f) => found[f]);
    if (first) inputs[first].current?.focus();
    return first !== undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    // The server also checks for the name and email, which this page can't see
    const result = (await loadPasswordRules()).checkPassword(password, {});
    const found: Errors = {};
    if (result.problem) found.password = result.message;
    else if (confirm !== password) found.confirm = MISMATCH;
    if (showErrors(found)) return;

    if (!navigator.onLine) {
      setFormError("You're offline. Saving needs a connection.");
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error } = await authClient.resetPassword(
        { newPassword: password, token },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!error) {
        router.replace(PASSWORD_SAVED_URL);
        return;
      }
      setPending(false);
      if (error.code === "INVALID_TOKEN") {
        router.replace(EXPIRED_URL);
      } else if (error.code && PASSWORD_CODES.has(error.code)) {
        showErrors({ password: error.message });
      } else if (error.status === 429) {
        setFormError(waitMessage(retryAfter));
      } else {
        setFormError(
          "Something went wrong on our side. Try again in a moment.",
        );
      }
    } catch {
      setPending(false);
      setFormError("You're offline. Saving needs a connection.");
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <TextField
        ref={inputs.password}
        id="password"
        type={shown.password ? "text" : "password"}
        label="New password"
        helper="At least 16 characters. A few unrelated words works well."
        error={errors.password}
        autoComplete="new-password"
        value={password}
        onChange={(event) => void changePassword(event.target.value)}
        trailing={
          <ShowButton
            shown={shown.password}
            what="new password"
            onToggle={() =>
              setShown((now) => ({ ...now, password: !now.password }))
            }
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
        id="confirm"
        type={shown.confirm ? "text" : "password"}
        label="Confirm new password"
        error={errors.confirm}
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => {
          setConfirm(event.target.value);
          setErrors((current) => ({ ...current, confirm: undefined }));
        }}
        trailing={
          <ShowButton
            shown={shown.confirm}
            what="confirmed password"
            onToggle={() =>
              setShown((now) => ({ ...now, confirm: !now.confirm }))
            }
          />
        }
      />
      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Saving" : "Save password"}
      </Button>
    </form>
  );
}
