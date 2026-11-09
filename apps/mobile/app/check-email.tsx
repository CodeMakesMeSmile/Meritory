import { RESEND_NOTICES } from "@meritory/contracts/sign-in-messages";
import { space } from "@meritory/design-tokens";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { TextLink } from "../components/text-link";
import { emailDraft } from "../lib/email-draft";
import { useOnline } from "../lib/online";
import { useResend } from "../lib/use-resend";

export default function CheckEmail() {
  const online = useOnline();
  const resend = useResend();
  const [email] = useState(emailDraft);
  const notice = online ? resend.notice : RESEND_NOTICES.offline;

  return (
    <Screen>
      <Heading title="Check your email">
        {email ? (
          <AppText>
            We sent a link to <AppText variant="bodyStrong">{email}</AppText>.
            It works for 1 hour.
          </AppText>
        ) : (
          <AppText>We sent you a link. It works for 1 hour.</AppText>
        )}
      </Heading>

      {notice && <Alert tone={notice.tone} text={notice.text} />}

      <AppText variant="small" color="textSecondary">
        No email after a few minutes? Check your spam folder
        {email ? ", or send a new link." : "."}
      </AppText>

      {email ? (
        <Button
          label={resend.label}
          variant="secondary"
          off={!online || resend.waiting}
          busy={resend.pending}
          onPress={() => resend.send(email)}
        />
      ) : null}

      <View style={styles.links}>
        <TextLink
          label="Use a different email"
          onPress={() => router.replace("/sign-up")}
        />
        <TextLink
          label="Back to sign in"
          onPress={() => router.replace("/sign-in")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: "row", gap: space[5] },
});
