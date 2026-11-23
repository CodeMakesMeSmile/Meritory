import { type SittingCard, sittingCards } from "@meritory/recall-client";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { Sitting } from "../components/recall/sitting";
import { Screen } from "../components/screen";
import { fetchContent, recallApi } from "../lib/api";
import { useSession } from "../lib/session";

type Load =
  | { state: "loading" }
  | { state: "failed" }
  | { state: "ready"; items: SittingCard[]; loadedAt: Date };

export default function Recall() {
  const router = useRouter();
  const { signOut } = useSession();
  const [load, setLoad] = useState<Load>({ state: "loading" });

  const start = useCallback(async () => {
    setLoad({ state: "loading" });
    const [content, session] = await Promise.all([
      fetchContent(),
      recallApi.loadSession(),
    ]);
    if (!content.ok || !session.ok) {
      const signedOut =
        (!content.ok && content.reason === "signed_out") ||
        (!session.ok && session.reason === "signed_out");
      if (signedOut) signOut();
      else setLoad({ state: "failed" });
      return;
    }
    setLoad({
      state: "ready",
      items: sittingCards(content.content, session.data),
      loadedAt: new Date(),
    });
  }, [signOut]);

  useEffect(() => {
    void start();
  }, [start]);

  const home = () => router.replace("/");

  return (
    <Screen bare>
      {load.state === "loading" && (
        <AppText
          variant="small"
          color="textSecondary"
          accessibilityLiveRegion="polite"
        >
          Loading your cards
        </AppText>
      )}
      {load.state === "failed" && (
        <View accessibilityRole="alert" style={styles.block}>
          <AppText variant="bodyStrong">Your cards didn't load</AppText>
          <AppText variant="small" color="textSecondary">
            Check your connection, then try again. Nothing you've done is lost.
          </AppText>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => void start()}
          />
          <Button label="Back to Home" variant="secondary" onPress={home} />
        </View>
      )}
      {load.state === "ready" && load.items.length === 0 && (
        <View style={styles.block}>
          <AppText variant="bodyStrong">Nothing due right now</AppText>
          <AppText variant="small" color="textSecondary">
            You've done today's cards.
          </AppText>
          <Button label="Back to Home" onPress={home} />
        </View>
      )}
      {load.state === "ready" && load.items.length > 0 && (
        <Sitting
          items={load.items}
          loadedAt={load.loadedAt}
          onLeave={home}
          onSignedOut={signOut}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
});
