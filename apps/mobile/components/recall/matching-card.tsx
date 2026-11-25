import { space, touchTarget } from "@meritory/design-tokens";
import {
  type MatchingCard as MatchingContent,
  matchingIsRight,
  promptOf,
  type SittingCard,
  shuffled,
} from "@meritory/recall-client";
import { type ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../lib/theme";
import { AppText } from "../app-text";
import { Button } from "../button";
import { Markdown } from "../markdown";
import {
  AnswerBox,
  CardActions,
  CardBox,
  type Checked,
  Explanation,
  FeedbackHeading,
  Prompt,
  recallStyles,
  TapRow,
} from "./parts";

/** The match name without its article, such as cost for "a cost" */
function bare(name: string) {
  return name.replace(/^an? /, "");
}

function nextEmpty(filled: readonly (string | null)[], after: number) {
  const later = filled.findIndex((match, at) => at > after && match === null);
  return later >= 0 ? later : filled.indexOf(null);
}

/** Fill each box with the match that goes in it */
export function MatchingCard({
  item,
  card,
  checked,
  onCheck,
  onDontKnow,
  busy,
  after,
}: {
  item: SittingCard;
  card: MatchingContent;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  onDontKnow: () => void;
  /** Another save or Undo is still on its way */
  busy: boolean;
  after: ReactNode;
}) {
  const theme = useTheme();
  const answers = card.pairs.map((pair) => pair.match);
  const choices = useMemo(
    () =>
      shuffled(
        [
          ...new Set([
            ...card.pairs.map((p) => p.match),
            ...(card.extraMatches ?? []),
          ]),
        ],
        `${item.key}:${item.session.dueAt}`,
      ),
    [card.pairs, card.extraMatches, item.key, item.session.dueAt],
  );
  const [filled, setFilled] = useState<(string | null)[]>(() =>
    card.pairs.map(() => null),
  );
  const [selected, setSelected] = useState<number | null>(0);

  function tapBox(at: number) {
    if (selected === at && filled[at] !== null) {
      setFilled((list) => list.map((match, i) => (i === at ? null : match)));
      return;
    }
    setSelected(at);
  }

  function tapChoice(choice: string) {
    const at = selected ?? filled.indexOf(null);
    if (at < 0) return;
    const next = filled.map((match, i) => (i === at ? choice : match));
    setFilled(next);
    const empty = nextEmpty(next, at);
    setSelected(empty >= 0 ? empty : null);
  }

  const complete = filled.every((match) => match !== null);

  if (checked) {
    // After I don't know each box shows its right match
    const shown = checked.dontKnow ? answers : filled;
    return (
      <>
        <CardBox>
          <FeedbackHeading {...checked} />
          <Prompt text={promptOf(item)} answered />
          <View style={recallStyles.blocks}>
            {card.pairs.map((pair, at) => {
              const wrong = shown[at] !== pair.match;
              return (
                <View key={pair.item} style={recallStyles.list}>
                  <Markdown text={pair.item} strong />
                  <AnswerBox result={wrong ? "wrong" : "right"}>
                    <Markdown text={shown[at] ?? ""} />
                    {wrong && (
                      <>
                        <AppText variant="small" color="statusDanger">
                          It's
                        </AppText>
                        <Markdown text={pair.match} variant="small" />
                      </>
                    )}
                  </AnswerBox>
                </View>
              );
            })}
          </View>
          {!checked.right && <Explanation card={card} />}
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt text={promptOf(item)} />
        <AppText variant="small" color="textSecondary">
          Tap a box, then the {bare(card.matchName)} that goes in it.
        </AppText>
        <View style={recallStyles.blocks}>
          {card.pairs.map((pair, at) => {
            const match = filled[at] ?? null;
            const isSelected = selected === at;
            return (
              <View key={pair.item} style={recallStyles.list}>
                <Markdown text={pair.item} strong />
                <TapRow
                  selected={isSelected}
                  dashed={match === null}
                  filled={match !== null}
                  label={`Box for ${pair.item}, ${match ?? "empty"}`}
                  onPress={() => tapBox(at)}
                >
                  <View style={recallStyles.fill}>
                    {match !== null ? (
                      <Markdown text={match} />
                    ) : (
                      <AppText variant="small" color="textSecondary">
                        {isSelected
                          ? `Now pick ${card.matchName}`
                          : "Tap to fill"}
                      </AppText>
                    )}
                  </View>
                </TapRow>
                {isSelected && match !== null && (
                  <AppText variant="small" color="textSecondary">
                    Pick a new {bare(card.matchName)}, or tap the box again to
                    clear it.
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
        <View style={recallStyles.list}>
          <AppText
            variant="small"
            color="textSecondary"
            accessibilityRole="header"
            style={styles.heading}
          >
            {card.matchHeading}
          </AppText>
          <View style={styles.choices}>
            {choices.map((choice) => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                onPress={() => tapChoice(choice)}
                style={[
                  styles.choice,
                  {
                    borderColor: theme.accentDefault,
                    backgroundColor: theme.bgCard,
                  },
                ]}
              >
                <Markdown text={choice} />
              </Pressable>
            ))}
          </View>
        </View>
      </CardBox>
      <CardActions onDontKnow={onDontKnow}>
        <Button
          label="Check matches"
          off={!complete}
          busy={busy}
          onPress={() => complete && onCheck(matchingIsRight(filled, answers))}
        />
      </CardActions>
      {after}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { textTransform: "uppercase" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  choice: {
    minHeight: touchTarget,
    justifyContent: "center",
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 1,
  },
});
