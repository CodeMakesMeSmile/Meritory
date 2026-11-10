import {
  EMAIL_ERROR,
  EMAIL_PATTERN,
  SIGN_UP_MESSAGES as MESSAGES,
  meterMessage,
  NAME_ERROR,
  signUpFieldFor,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import type { PasswordCheck } from "@meritory/password";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { Heading, Switch } from "../components/heading";
import { OrDivider, ProviderButtons } from "../components/provider-buttons";
import { Screen } from "../components/screen";
import { StrengthMeter } from "../components/strength-meter";
import { type FieldRef, TextField } from "../components/text-field";
import { PasswordToggle, TextLink } from "../components/text-link";
import { authClient } from "../lib/auth-client";
import { setEmailDraft } from "../lib/email-draft";
import { useOnline } from "../lib/online";
import { loadPasswordRules } from "../lib/password-rules";
import { useProviderSignIn } from "../lib/provider-sign-in";

type Field = "name" | "email" | "password";
type Errors = Partial<Record<Field, string>>;
type Values = Record<Field, string>;

const FIELDS: Field[] = ["name", "email", "password"];

export default function SignUp() {
  const online = useOnline();
  const { notice: providerNotice, clear: clearProviderNotice } =
    useProviderSignIn();
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [strengthMessages, setStrengthMessages] = useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = {
    name: useRef<FieldRef>(null),
    email: useRef<FieldRef>(null),
    password: useRef<FieldRef>(null),
  };

  async function updateStrength(next: Values) {
    if (!next.password) {
      setCheck(null);
      return;
    }
    const rules = await loadPasswordRules();
    setStrengthMessages(rules.STRENGTH_MESSAGES);
    setCheck(rules.checkPassword(next.password, next));
  }

  function change(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors((current) => ({ ...current, [field]: undefined }));
    void updateStrength(next);
  }

  function showErrors(found: Errors) {
    setErrors(found);
    const first = FIELDS.find((field) => found[field]);
    if (first) inputs[first].current?.focus();
    return first !== undefined;
  }

  async function submit() {
    if (pending) return;
    setFormError(null);
    clearProviderNotice();
    const name = values.name.trim();
    const email = values.email.trim();
    const { password } = values;

    const found: Errors = {};
    if (!name) found.name = NAME_ERROR;
    if (!EMAIL_PATTERN.test(email)) found.email = EMAIL_ERROR;
    const result = (await loadPasswordRules()).checkPassword(password, {
      name,
      email,
    });
    if (result.problem) found.password = result.message;
    if (showErrors(found)) return;

    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (!error) {
        setEmailDraft(email);
        router.replace("/check-email");
        return;
      }
      const field = signUpFieldFor(error.code);
      if (field) {
        showErrors({
          [field]: field === "email" ? EMAIL_ERROR : error.message,
        });
        return;
      }
      setFormError(error.status === 429 ? waitMessage(null) : MESSAGES.failed);
    } catch {
      setFormError(MESSAGES.offline);
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Heading title="Create your account">
        <Switch>
          <AppText variant="small" color="textSecondary">
            Already have an account?
          </AppText>
          <TextLink
            label="Sign in"
            onPress={() => {
              clearProviderNotice();
              router.replace("/sign-in");
            }}
          />
        </Switch>
      </Heading>

      {!online && <Alert tone="info" text={MESSAGES.offline} />}
      {online && formError && <Alert tone="danger" text={formError} />}
      {online && !formError && providerNotice && (
        <Alert tone={providerNotice.tone} text={providerNotice.text} />
      )}

      <ProviderButtons disabled={pending} />
      <OrDivider />

      <TextField
        ref={inputs.name}
        label="What should we call you?"
        helper="Only you see this."
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        value={values.name}
        onChangeText={(value) => change("name", value)}
        onSubmitEditing={() => inputs.email.current?.focus()}
      />
      <TextField
        ref={inputs.email}
        label="Email"
        helper="We'll send a link to confirm it."
        error={errors.email}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        value={values.email}
        onChangeText={(value) => change("email", value)}
        onSubmitEditing={() => inputs.password.current?.focus()}
      />
      <TextField
        ref={inputs.password}
        label="Password"
        helper="At least 16 characters. A few unrelated words works well."
        error={errors.password}
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        value={values.password}
        onChangeText={(value) => change("password", value)}
        onSubmitEditing={() => online && submit()}
        trailing={
          <PasswordToggle
            shown={showPassword}
            onToggle={() => setShowPassword((shown) => !shown)}
          />
        }
        below={
          <StrengthMeter
            strength={check?.strength ?? null}
            message={meterMessage(check, strengthMessages)}
          />
        }
      />

      <Button
        label={pending ? "Creating account" : "Create account"}
        busy={pending}
        off={!online}
        onPress={submit}
      />
    </Screen>
  );
}
