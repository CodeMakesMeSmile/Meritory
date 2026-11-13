import * as Linking from "expo-linking";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Alert } from "../components/alert";
import { Button } from "../components/button";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { TextLink } from "../components/text-link";
import { webOrigin } from "../lib/auth-client";
import { useProviderSignIn } from "../lib/provider-sign-in";
import { useSession } from "../lib/session";

export default function Home() {
  const { user, signOut } = useSession();
  const { linked, clear } = useProviderSignIn();

  useEffect(() => clear, [clear]);

  return (
    <Screen>
      <Heading title={`Signed in as ${user?.name ?? ""}`} />
      {linked && <Alert tone="success" text={linked} />}
      <Button label="Sign out" variant="secondary" onPress={signOut} />
      <View style={styles.links}>
        <TextLink
          label="Delete account on the website"
          role="link"
          accessibilityHint="Opens Account in your browser"
          onPress={() => void Linking.openURL(`${webOrigin()}/account`)}
        />
      </View>
    </Screen>
  );
}

// Keeps the tap area to the words, not the whole row
const styles = StyleSheet.create({
  links: { alignItems: "flex-start" },
});
