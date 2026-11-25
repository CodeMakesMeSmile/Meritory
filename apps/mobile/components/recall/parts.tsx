import { space, touchTarget } from "@meritory/design-tokens";
import type { Card } from "@meritory/recall-client";
import * as Linking from "expo-linking";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { linkTarget } from "../../lib/markdown-nodes";
import { useTheme } from "../../lib/theme";
import { AppText } from "../app-text";
import { Markdown } from "../markdown";
import { TextLink } from "../text-link";

/** What a checked card shows above its answer */
export interface Checked {
  right: boolean;
  /** The reminder that trying first helps, shown on the first miss only */
  encourage: boolean;
  /** How long until the card comes back. Null once the rating was turned down. */
  wait: string | null;
}

/** The ink-ruled box each card sits in */
export function CardBox({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.bgCard, borderColor: theme.accentDefault },
      ]}
    >
      {children}
    </View>
  );
}

/** The question, smaller once it's answered so the answer leads */
export function Prompt({
  text,
  answered = false,
}: {
  text: string;
  answered?: boolean;
}) {
  return (
    <Markdown
      text={text}
      variant={answered ? "body" : "prompt"}
      strong={answered}
    />
  );
}

/** When the card comes back, such as "You'll get another go in 1 minute." */
export function waitLine(right: boolean, wait: string) {
  return right
    ? `You'll see this again in ${wait}.`
    : `You'll get another go in ${wait}.`;
}

/** Got it or Not quite, read out as soon as it shows */
export function FeedbackHeading({
  right,
  encourage,
  wait,
  showWait = true,
}: Checked & { showWait?: boolean }) {
  return (
    <View style={styles.tight} accessibilityLiveRegion="polite">
      <AppText
        variant="heading3"
        accessibilityRole="header"
        color={right ? "statusSuccess" : "textPrimary"}
      >
        {right ? "Got it" : "Not quite"}
      </AppText>
      {encourage && (
        <AppText variant="small" color="textSecondary">
          Trying first, then checking the answer, helps it stick.
        </AppText>
      )}
      {showWait && wait !== null && (
        <AppText variant="small" color="textSecondary">
          {waitLine(right, wait)}
        </AppText>
      )}
    </View>
  );
}

/** A small heading over a part of a card */
export function Label({
  text,
  color = "textPrimary",
}: {
  text: string;
  color?: "textPrimary" | "textSecondary" | "statusDanger" | "statusSuccess";
}) {
  return (
    <AppText variant="smallStrong" color={color} accessibilityRole="header">
      {text}
    </AppText>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.tight}>
      <Label text={label} />
      <Markdown text={text} variant="small" />
    </View>
  );
}

export function MixUp({ text }: { text: string }) {
  return <Note label="Common mix-up" text={text} />;
}

/** What the card teaches, with when it comes back under the title */
export function Lesson({
  card,
  missed,
  wait,
  full = true,
  announce = false,
}: {
  card: Card;
  missed: boolean;
  wait: string | null;
  /** With the mix-up and source, which a free-answer card already showed or leaves out */
  full?: boolean;
  /** Read out when it shows, for a card with no Got it or Not quite above */
  announce?: boolean;
}) {
  const { lesson } = card;
  const source = full ? linkTarget(lesson.source?.url) : null;
  return (
    <View style={styles.blocks}>
      <View
        style={styles.tight}
        accessibilityLiveRegion={announce ? "polite" : "none"}
      >
        <AppText variant="heading2" accessibilityRole="header">
          {lesson.title}
        </AppText>
        {wait !== null && (
          <AppText variant="small" color="textSecondary">
            {waitLine(!missed, wait)}
          </AppText>
        )}
      </View>
      <Markdown text={lesson.explanation} />
      {missed && lesson.fix && <Note label="Next time" text={lesson.fix} />}
      {missed && full && card.misconception && (
        <MixUp text={card.misconception} />
      )}
      {source && lesson.source && (
        <View style={styles.link}>
          <TextLink
            label={lesson.source.title}
            role="link"
            accessibilityHint="Opens in your browser"
            onPress={() => void Linking.openURL(source)}
          />
        </View>
      )}
    </View>
  );
}

/** Just the lesson's explanation, under a checked order or set of matches */
export function Explanation({ card }: { card: Card }) {
  return <Markdown text={card.lesson.explanation} variant="small" secondary />;
}

/** A full-width row to tap, such as a step to place or an answer to pick */
export function TapRow({
  children,
  onPress,
  selected = false,
  dashed = false,
  filled = false,
  role = "button",
  label,
  hint,
}: {
  children: ReactNode;
  onPress: () => void;
  selected?: boolean;
  dashed?: boolean;
  /** Holds an answer, so it sits on the sunken ground without a rule */
  filled?: boolean;
  role?: "button" | "radio";
  label?: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={
        role === "radio" ? { checked: selected } : { selected }
      }
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: filled || selected ? theme.bgSunken : theme.bgCard,
          borderColor:
            filled && !selected ? "transparent" : theme.accentDefault,
          borderWidth: selected ? 2 : 1,
          borderStyle: dashed && !selected ? "dashed" : "solid",
          // Keeps the words still when the rule thickens
          paddingHorizontal: selected ? space[3] - 1 : space[3],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

/** An answer shown back, ruled red when wrong and green when right once checked */
export function AnswerBox({
  children,
  result,
}: {
  children: ReactNode;
  /** Left out while the answer is still being built */
  result?: "right" | "wrong";
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.answer,
        result
          ? {
              borderWidth: 1,
              borderColor:
                result === "wrong" ? theme.statusDanger : theme.statusSuccess,
            }
          : { backgroundColor: theme.bgSunken },
      ]}
    >
      {children}
    </View>
  );
}

export const recallStyles = StyleSheet.create({
  blocks: { gap: space[4] },
  tight: { gap: space[1] },
  list: { gap: space[2] },
  fill: { flex: 1 },
});

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: space[5], gap: space[5] },
  blocks: { gap: space[4] },
  tight: { gap: space[1] },
  link: { minHeight: touchTarget, justifyContent: "center" },
  row: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[3],
  },
  answer: { gap: space[1], padding: space[3] },
});
