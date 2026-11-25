import { space, touchTarget } from "@meritory/design-tokens";
import {
  type OrderingCard as OrderingContent,
  orderingIsRight,
  ordinal,
  promptOf,
  type SittingCard,
  shuffled,
} from "@meritory/recall-client";
import { type ReactNode, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { splitTerms, type Term } from "../../lib/terms";
import { useTheme } from "../../lib/theme";
import { AppText } from "../app-text";
import { Button } from "../button";
import { Markdown } from "../markdown";
import { TextLink } from "../text-link";
import {
  AnswerBox,
  CardActions,
  CardBox,
  type Checked,
  Explanation,
  FeedbackHeading,
  Label,
  Prompt,
  recallStyles,
  TapRow,
} from "./parts";

/** Put the steps in order by tapping them from first to last */
export function OrderingCard({
  item,
  card,
  checked,
  onCheck,
  onDontKnow,
  busy,
  after,
}: {
  item: SittingCard;
  card: OrderingContent;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  onDontKnow: () => void;
  /** Another save or Undo is still on its way */
  busy: boolean;
  after: ReactNode;
}) {
  const theme = useTheme();
  // Steps are known by their right place, starting at 0
  const shown = useMemo(
    () =>
      shuffled(
        card.steps.map((_, at) => at),
        `${item.key}:${item.session.dueAt}`,
      ),
    [card.steps, item.key, item.session.dueAt],
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [term, setTerm] = useState<Term | null>(null);
  const terms = card.terms ?? [];
  const left = shown.filter((step) => !placed.includes(step));
  const done = left.length === 0;

  // A defined term is tapped to show what it means
  const mark = (words: string) =>
    splitTerms(words, terms).map((part, at) =>
      part.term ? (
        <Text
          key={at}
          accessibilityRole="button"
          accessibilityHint="Shows what it means"
          onPress={() => setTerm(part.term ?? null)}
          style={[styles.term, { color: theme.textAccent }]}
        >
          {part.text}
        </Text>
      ) : (
        part.text
      ),
    );

  // After I don't know the right order shows in place of the learner's
  const listed = checked?.dontKnow ? card.steps.map((_, at) => at) : placed;

  const order = (
    <View style={recallStyles.list}>
      {listed.map((step, at) => {
        const wrong = checked !== null && step !== at;
        return (
          <AnswerBox
            key={step}
            result={checked === null ? undefined : wrong ? "wrong" : "right"}
          >
            <View style={styles.step}>
              <AppText variant="numeric" color="textSecondary">
                {at + 1}
              </AppText>
              <View style={recallStyles.fill}>
                <Markdown
                  text={card.steps[step] ?? ""}
                  renderText={checked ? undefined : mark}
                />
                {wrong && (
                  <AppText variant="small" color="statusDanger">
                    Goes {ordinal(step)}
                  </AppText>
                )}
              </View>
            </View>
          </AnswerBox>
        );
      })}
    </View>
  );

  if (checked) {
    return (
      <>
        <CardBox>
          <FeedbackHeading {...checked} />
          <Prompt text={promptOf(item)} answered />
          <Label text={checked.dontKnow ? "The right order" : "Your order"} />
          {order}
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
          Tap the steps from first to last.
          {terms.length > 0 && " Tap an underlined word to see what it means."}
        </AppText>
        {placed.length > 0 && (
          <View style={recallStyles.list}>
            <Label text="Your order" />
            {order}
            <View style={styles.undo}>
              <TextLink
                label="Undo last step"
                onPress={() => setPlaced((list) => list.slice(0, -1))}
              />
            </View>
          </View>
        )}
        {!done && (
          <View style={recallStyles.list}>
            <Label text="Still to place" />
            {left.map((step) => (
              <TapRow
                key={step}
                onPress={() => setPlaced((list) => [...list, step])}
              >
                <View style={recallStyles.fill}>
                  <Markdown text={card.steps[step] ?? ""} />
                </View>
              </TapRow>
            ))}
          </View>
        )}
        {term && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.meaning, { borderTopColor: theme.borderSubtle }]}
          >
            <AppText variant="smallStrong" color="textAccent">
              {term.term}
            </AppText>
            <Markdown text={term.definition} variant="small" />
          </View>
        )}
      </CardBox>
      <CardActions onDontKnow={onDontKnow}>
        <Button
          label="Check order"
          off={!done}
          busy={busy}
          onPress={() =>
            done && onCheck(orderingIsRight(placed, card.steps.length))
          }
        />
      </CardActions>
      {after}
    </>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", gap: space[3] },
  term: { textDecorationLine: "underline" },
  undo: {
    minHeight: touchTarget,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  meaning: { gap: space[1], borderTopWidth: 1, paddingTop: space[4] },
});
