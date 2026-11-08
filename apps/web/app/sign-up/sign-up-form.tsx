"use client";

import type { PasswordCheck } from "@meritory/password";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button, linkClass } from "@/components/button";
import { OrDivider, ProviderButtons } from "@/components/provider-buttons";
import { StrengthMeter } from "@/components/strength-meter";
import { TextField } from "@/components/text-field";
import { authClient, SIGN_UP_EMAIL_KEY } from "@/lib/auth-client";
import { EMAIL_ERROR, EMAIL_PATTERN } from "@/lib/email";
import { loadPasswordRules, meterMessage } from "@/lib/password-rules";
import { PROVIDER_LABELS } from "@/lib/providers";

type Field = "name" | "email" | "password";
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["name", "email", "password"];

const FIELD_BY_CODE: Record<string, Field> = {
  NAME_INVALID: "name",
  INVALID_EMAIL: "email",
  PASSWORD_TOO_SHORT: "password",
  PASSWORD_TOO_LONG: "password",
  PASSWORD_PERSONAL: "password",
  PASSWORD_TOO_WEAK: "password",
};

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [strengthMessages, setStrengthMessages] = useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  async function updateStrength(next: {
    name: string;
    email: string;
    password: string;
  }) {
    if (!next.password) {
      setCheck(null);
      return;
    }
    const rules = await loadPasswordRules();
    setStrengthMessages(rules.STRENGTH_MESSAGES);
    setCheck(rules.checkPassword(next.password, next));
  }

  function change(field: Field, value: string) {
    const next = { name, email, password, [field]: value };
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    void updateStrength(next);
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
    setFormError(null);

    const found: Errors = {};
    if (!name.trim()) found.name = "Enter a name. A nickname is fine.";
    if (!EMAIL_PATTERN.test(email.trim())) found.email = EMAIL_ERROR;
    const result = (await loadPasswordRules()).checkPassword(password, {
      name,
      email,
    });
    if (result.problem) found.password = result.message;
    if (showErrors(found)) return;

    setPending(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (!error) {
      try {
        sessionStorage.setItem(SIGN_UP_EMAIL_KEY, email.trim());
      } catch {
        // Storage can be blocked. The next page then leaves the address out.
      }
      router.push("/check-email");
      return;
    }

    setPending(false);
    const field = error.code ? FIELD_BY_CODE[error.code] : undefined;
    if (field) {
      showErrors({ [field]: field === "email" ? EMAIL_ERROR : error.message });
      return;
    }
    setFormError(
      error.status === 429
        ? "Too many tries. Wait a few seconds, then try again."
        : "Something went wrong on our side. Try again in a moment.",
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-display">Create your account</h1>
        <p className="flex items-center gap-1 text-small text-secondary">
          Already have an account?
          <Link href="/sign-in" className={linkClass}>
            Sign in
          </Link>
        </p>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-control border border-danger bg-card p-3 text-small"
        >
          {formError}
        </p>
      )}

      <ProviderButtons
        callbackURL="/"
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
        ref={inputs.name}
        id="name"
        label="What should we call you?"
        helper="Only you see this."
        error={errors.name}
        autoComplete="name"
        value={name}
        onChange={(event) => change("name", event.target.value)}
      />
      <TextField
        ref={inputs.email}
        id="email"
        type="email"
        label="Email"
        helper="We'll send a link to confirm it."
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
        helper="At least 16 characters. A few unrelated words works well."
        error={errors.password}
        autoComplete="new-password"
        value={password}
        onChange={(event) => change("password", event.target.value)}
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
        below={
          <StrengthMeter
            strength={check?.strength ?? null}
            message={meterMessage(check, strengthMessages)}
          />
        }
      />

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
