import {
  EMAIL_ERROR,
  EMAIL_PATTERN,
  RESET_LINK_NOTICES as NOTICES,
  waitMessage,
} from "@meritory/contracts/sign-in-messages";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { type FieldRef, TextField } from "../components/text-field";
import { TextLink } from "../components/text-link";
import { authClient } from "../lib/auth-client";
import { emailDraft } from "../lib/email-draft";
import { useOnline } from "../lib/online";

type Notice = { tone: "info" | "danger"; text: string };

export default function ForgotPassword() {
  const online = useOnline();
  const [email, setEmail] = useState(emailDraft);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<FieldRef>(null);

  async function submit() {
    if (pending) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(EMAIL_ERROR);
      input.current?.focus();
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
    <Screen>
      <Heading title="Reset your password">
        <AppText>
          Enter your email and we'll send a link to choose a new password.
        </AppText>
      </Heading>

      {!online && <Alert tone="info" text={NOTICES.offline.text} />}
      {online && notice && <Alert tone={notice.tone} text={notice.text} />}

      <TextField
        ref={input}
        label="Email"
        error={error}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setError(undefined);
        }}
        onSubmitEditing={() => online && submit()}
      />

      <Button
        label={pending ? "Sending link" : "Send reset link"}
        busy={pending}
        off={!online}
        onPress={submit}
      />

      <View style={{ alignSelf: "flex-start" }}>
        <TextLink
          label="Back to sign in"
          onPress={() => router.dismissTo("/sign-in")}
        />
      </View>
    </Screen>
  );
}
