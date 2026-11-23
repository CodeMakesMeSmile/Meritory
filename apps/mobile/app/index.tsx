import type {
  ContentResponse,
  InterviewDateResponse,
  RecallDueResponse,
} from "@meritory/contracts";
import { space, touchTarget } from "@meritory/design-tokens";
import {
  allChapters,
  dayName,
  interviewIsAhead,
  nothingDueLine,
  plural,
  type QueueRow,
  queueNote,
  queueParts,
  queueRows,
  trackLabel,
} from "@meritory/recall-client";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { CountSquares } from "../components/count-squares";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { TextLink } from "../components/text-link";
import { fetchContent, recallApi } from "../lib/api";
import { webOrigin } from "../lib/auth-client";
import { useProviderSignIn } from "../lib/provider-sign-in";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";

type Load =
  | { state: "loading" }
  | { state: "failed" }
  | {
      state: "ready";
      content: ContentResponse;
      due: RecallDueResponse;
      /** Null when the date didn't load, which only hides its line */
      interview: InterviewDateResponse | null;
    };

function today() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function QueueItem({ row }: { row: QueueRow }) {
  return (
    <View style={styles.queueItem}>
      <View style={styles.titleRow}>
        <AppText variant="heading3" style={styles.fill}>
          {row.chapter.title}
        </AppText>
        <AppText variant="numeric" color="textSecondary">
          {plural(row.due + row.offered, "card")}
        </AppText>
      </View>
      <View style={styles.meta}>
        <AppText variant="small" color="textAccent">
          {trackLabel(row.track)}
        </AppText>
        <AppText variant="small" color="textSecondary">
          {queueParts(row)}
        </AppText>
      </View>
    </View>
  );
}

function Chapters({
  content,
  due,
}: {
  content: ContentResponse;
  due: RecallDueResponse;
}) {
  const chapters = allChapters(content);
  const tracks = [...new Set(chapters.map(({ track }) => track))];
  return (
    <View style={styles.section}>
      <AppText variant="heading3" accessibilityRole="header">
        Chapters
      </AppText>
      {tracks.map((track) => (
        <View key={track.id} style={styles.section}>
          <AppText variant="small" color="textAccent">
            {trackLabel(track)}
          </AppText>
          {chapters
            .filter((c) => c.track === track)
            .map(({ chapter }) => {
              const counts = due.chapters.find(
                (c) => c.trackId === track.id && c.chapterId === chapter.id,
              );
              const learned = counts?.learned ?? 0;
              const total = counts?.total ?? chapter.cards.length;
              return (
                <View key={chapter.id} style={styles.chapter}>
                  <AppText variant="bodyStrong">{chapter.title}</AppText>
                  <CountSquares filled={learned} total={total} />
                  <AppText variant="small" color="textSecondary">
                    {learned} of {plural(total, "card")} learned
                  </AppText>
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const { signOut } = useSession();
  const { linked, clear } = useProviderSignIn();
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => clear, [clear]);

  const refresh = useCallback(async () => {
    const [content, due, interview] = await Promise.all([
      fetchContent(),
      recallApi.loadDue(),
      recallApi.loadInterviewDate(),
    ]);
    if (!content.ok || !due.ok) {
      const signedOut =
        (!content.ok && content.reason === "signed_out") ||
        (!due.ok && due.reason === "signed_out");
      if (signedOut) signOut();
      else setLoad({ state: "failed" });
      return;
    }
    setLoad({
      state: "ready",
      content: content.content,
      due: due.data,
      interview: interview.ok ? interview.data : null,
    });
  }, [signOut]);

  // Runs again on the way back from a sitting, so the counts are current
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const ready = load.state === "ready" ? load : null;
  const rows = ready ? queueRows(ready.due, allChapters(ready.content)) : [];
  const started = (ready?.due.chapters.length ?? 0) > 0;

  return (
    <Screen>
      <Heading title="Due for recall">
        <AppText variant="small" color="textSecondary">
          {today()}
        </AppText>
      </Heading>
      {linked && <Alert tone="success" text={linked} />}

      {load.state === "loading" && (
        <View style={styles.block}>
          <View style={[styles.holder, { backgroundColor: theme.bgSunken }]} />
          <AppText
            variant="small"
            color="textSecondary"
            accessibilityLiveRegion="polite"
          >
            Loading your cards
          </AppText>
        </View>
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
            onPress={() => {
              setLoad({ state: "loading" });
              void refresh();
            }}
          />
        </View>
      )}

      {ready && !started && (
        <View style={styles.tight}>
          <AppText variant="bodyStrong">Nothing to recall yet</AppText>
          <AppText variant="small" color="textSecondary">
            Start a chapter on the website and its cards join recall, up to 10
            new a day.
          </AppText>
        </View>
      )}

      {ready && started && rows.length === 0 && (
        <View style={styles.tight}>
          <AppText variant="bodyStrong">Nothing due right now</AppText>
          <AppText variant="small" color="textSecondary">
            {nothingDueLine(ready.due)}
          </AppText>
        </View>
      )}

      {ready && rows.length > 0 && (
        <View style={styles.block}>
          {rows.map((row) => (
            <QueueItem key={`${row.track.id}/${row.chapter.id}`} row={row} />
          ))}
          <AppText variant="small" color="textSecondary">
            {queueNote(ready.due)}
          </AppText>
          <Button label="Start recall" onPress={() => router.push("/recall")} />
        </View>
      )}

      {ready && (
        <View style={[styles.rule, { borderTopColor: theme.borderSubtle }]}>
          <Chapters content={ready.content} due={ready.due} />
        </View>
      )}

      {ready && (
        <View style={styles.links}>
          <TextLink
            label={
              interviewIsAhead(ready.interview) && ready.interview?.date
                ? `Interview on ${dayName(ready.interview.date)}`
                : "Add an interview date"
            }
            onPress={() => router.push("/interview-date")}
          />
        </View>
      )}
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  block: { gap: space[3] },
  tight: { gap: space[1] },
  section: { gap: space[3] },
  chapter: { gap: space[2] },
  holder: { height: 80 },
  queueItem: { gap: space[1] },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: space[3] },
  meta: { flexDirection: "row", gap: space[3] },
  rule: { borderTopWidth: 1, paddingTop: space[5] },
  // Keeps the tap area to the words, not the whole row
  links: { minHeight: touchTarget, alignItems: "flex-start" },
});
