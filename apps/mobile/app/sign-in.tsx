import {
  EMAIL_ERROR,
  EMAIL_PATTERN,
  SIGN_IN_MESSAGES as MESSAGES,
  PASSWORD_REQUIRED,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { Heading, Switch } from "../components/heading";
import { Screen } from "../components/screen";
import { type FieldRef, TextField } from "../components/text-field";
import { PasswordToggle, TextLink } from "../components/text-link";
import { authClient } from "../lib/auth-client";
import { setEmailDraft } from "../lib/email-draft";
import { useOnline } from "../lib/online";
import { useSession } from "../lib/session";
import { useResend } from "../lib/use-resend";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;

export default function SignIn() {
  const online = useOnline();
  const { endedElsewhere } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // The address that needs confirming, once the server says so
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const resend = useResend();
  const emailInput = useRef<FieldRef>(null);
  const passwordInput = useRef<FieldRef>(null);

  async function submit() {
    if (pending) return;
    setFormError(null);

    const found: Errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) found.email = EMAIL_ERROR;
    if (!password) found.password = PASSWORD_REQUIRED;
    setErrors(found);
    if (found.email) return emailInput.current?.focus();
    if (found.password) return passwordInput.current?.focus();

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
      if (!error) return;
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
      setFormError(MESSAGES.offline);
    } finally {
      setPending(false);
    }
  }

  function notice() {
    if (!online) return <Alert tone="info" text={MESSAGES.offline} />;
    if (formError) return <Alert tone="danger" text={formError} />;
    if (unconfirmed) {
      return (
        <>
          <Alert
            tone={resend.notice?.tone ?? "info"}
            text={resend.notice?.text ?? MESSAGES.unconfirmed}
          />
          <Button
            label={resend.label}
            variant="secondary"
            off={resend.waiting}
            busy={resend.pending}
            onPress={() => resend.send(unconfirmed)}
          />
        </>
      );
    }
    if (endedElsewhere) {
      return (
        <Alert tone="info" text="You were signed out. Sign in to continue." />
      );
    }
    return null;
  }

  return (
    <Screen>
      <Heading title="Sign in">
        <Switch>
          <AppText variant="small" color="textSecondary">
            New to Meritory?
          </AppText>
          <TextLink
            label="Create an account"
            onPress={() => router.replace("/sign-up")}
          />
        </Switch>
      </Heading>

      {notice()}

      <TextField
        ref={emailInput}
        label="Email"
        error={errors.email}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined }));
        }}
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <TextField
        ref={passwordInput}
        label="Password"
        error={errors.password}
        autoComplete="current-password"
        textContentType="password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
        }}
        onSubmitEditing={() => online && submit()}
        aside={
          <TextLink
            label="Forgot password?"
            onPress={() => {
              setEmailDraft(email.trim());
              router.push("/forgot-password");
            }}
          />
        }
        trailing={
          <PasswordToggle
            shown={showPassword}
            onToggle={() => setShowPassword((shown) => !shown)}
          />
        }
      />

      <Button
        label={pending ? "Signing in" : "Sign in"}
        busy={pending}
        off={!online}
        onPress={submit}
      />
    </Screen>
  );
}
