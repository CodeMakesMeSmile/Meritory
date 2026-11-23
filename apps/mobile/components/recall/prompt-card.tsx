import { space } from "@meritory/design-tokens";
import {
  type PromptCard as PromptCardContent,
  promptOf,
  RATING_LABELS,
  RATINGS,
  type RecallRating,
  type SittingCard,
  shortWait,
} from "@meritory/recall-client";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../lib/theme";
import { AppText, inputFont } from "../app-text";
import { Button } from "../button";
import { Markdown } from "../markdown";
import {
  CardBox,
  type Checked,
  Label,
  Lesson,
  MixUp,
  Prompt,
  recallStyles,
} from "./parts";

/** A free-recall card: answer, show the key points, then rate yourself */
export function PromptCard({
  item,
  card,
  now,
  checked,
  saving,
  onRate,
  after,
}: {
  item: SittingCard;
  card: PromptCardContent;
  now: Date;
  /** Set once the card is rated Missed, to show its lesson */
  checked: Checked | null;
  saving: boolean;
  onRate: (rating: RecallRating) => void;
  after: ReactNode;
}) {
  const theme = useTheme();
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const typed = answer.trim();

  if (checked) {
    return (
      <>
        <CardBox>
          <Prompt text={promptOf(item)} answered />
          <Lesson
            card={card}
            missed
            wait={checked.wait}
            full={false}
            announce
          />
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt text={promptOf(item)} answered={revealed} />
        {revealed ? (
          <>
            <View style={[styles.typed, { backgroundColor: theme.bgSunken }]}>
              <Label text="Your answer" color="textSecondary" />
              <AppText variant="small">
                {typed ||
                  "Nothing typed. Compare the key points with what you thought."}
              </AppText>
            </View>
            <View style={recallStyles.list} accessibilityLiveRegion="polite">
              <AppText variant="heading3" accessibilityRole="header">
                Key points
              </AppText>
              {card.points.map((point) => (
                <View key={point} style={styles.point}>
                  <AppText color="textSecondary">{"•"}</AppText>
                  <View style={recallStyles.fill}>
                    <Markdown text={point} />
                  </View>
                </View>
              ))}
            </View>
            {card.misconception && <MixUp text={card.misconception} />}
          </>
        ) : (
          <View style={recallStyles.list}>
            <AppText variant="small" color="textSecondary" nativeID="answer">
              Answer in your own words, out loud or typed. A guess still helps.
            </AppText>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              multiline
              maxLength={4000}
              accessibilityLabelledBy="answer"
              accessibilityLabel="Your answer"
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  borderColor: theme.borderDefault,
                  backgroundColor: theme.bgCard,
                  color: theme.textPrimary,
                  fontFamily: inputFont,
                },
              ]}
            />
          </View>
        )}
      </CardBox>
      {revealed ? (
        <View style={recallStyles.blocks}>
          <AppText variant="small" color="textSecondary">
            How did that go? Partly right counts as Missed.
          </AppText>
          <View style={styles.ratings}>
            {RATINGS.map((rating) => {
              const wait = shortWait(now, new Date(item.session.next[rating]));
              return (
                <Pressable
                  key={rating}
                  accessibilityRole="button"
                  accessibilityLabel={`${RATING_LABELS[rating]}, back in ${wait}`}
                  accessibilityState={{ busy: saving }}
                  disabled={saving}
                  onPress={() => onRate(rating)}
                  style={[
                    styles.rating,
                    {
                      borderColor: theme.accentDefault,
                      backgroundColor: theme.bgCard,
                    },
                  ]}
                >
                  <AppText variant="bodyStrong">
                    {RATING_LABELS[rating]}
                  </AppText>
                  <AppText variant="numeric" color="textSecondary">
                    {wait}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Button label="Show key points" onPress={() => setRevealed(true)} />
      )}
      {after}
    </>
  );
}

const styles = StyleSheet.create({
  typed: { gap: space[1], padding: space[3] },
  point: { flexDirection: "row", gap: space[2] },
  input: {
    minHeight: 96,
    borderWidth: 1,
    padding: space[3],
    fontSize: 16,
    lineHeight: 24,
  },
  ratings: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  rating: {
    // Two to a row
    flexBasis: "45%",
    flexGrow: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: space[1],
    paddingVertical: space[2],
    borderWidth: 1,
  },
});
