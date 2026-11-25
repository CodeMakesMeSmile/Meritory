import {
  type PickOneCard as PickOneContent,
  promptOf,
  type SittingCard,
  shuffled,
} from "@meritory/recall-client";
import { type ReactNode, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../lib/theme";
import { Button } from "../button";
import { Markdown } from "../markdown";
import {
  AnswerBox,
  CardBox,
  type Checked,
  FeedbackHeading,
  Label,
  Lesson,
  Prompt,
  recallStyles,
  TapRow,
} from "./parts";

/** Pick the one right answer from a few */
export function PickOneCard({
  item,
  card,
  checked,
  onCheck,
  busy,
  after,
}: {
  item: SittingCard;
  card: PickOneContent;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  /** Another save or Undo is still on its way */
  busy: boolean;
  after: ReactNode;
}) {
  const theme = useTheme();
  const options = useMemo(
    () => shuffled(card.options, `${item.key}:${item.session.dueAt}`),
    [card.options, item.key, item.session.dueAt],
  );
  const [picked, setPicked] = useState<number | null>(null);
  const pick = picked === null ? null : options[picked];
  const answer = options.find((option) => option.correct);

  if (checked && pick) {
    return (
      <>
        <CardBox>
          <FeedbackHeading {...checked} showWait={false} />
          <Prompt text={promptOf(item)} answered />
          <AnswerBox result={checked.right ? "right" : "wrong"}>
            <Label
              text="Your pick"
              color={checked.right ? "statusSuccess" : "statusDanger"}
            />
            <Markdown text={pick.text} />
            <Markdown text={pick.reason} variant="small" secondary />
          </AnswerBox>
          {!checked.right && answer && (
            <AnswerBox result="right">
              <Label text="Here's the answer" color="statusSuccess" />
              <Markdown text={answer.text} />
              <Markdown text={answer.reason} variant="small" secondary />
            </AnswerBox>
          )}
          <Lesson card={card} missed={!checked.right} wait={checked.wait} />
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt text={promptOf(item)} />
        <View style={recallStyles.list} accessibilityRole="radiogroup">
          <Label text="Pick one" />
          {options.map((option, at) => (
            <TapRow
              key={option.text}
              role="radio"
              selected={picked === at}
              onPress={() => setPicked(at)}
            >
              <View
                style={[
                  styles.dot,
                  {
                    borderColor: theme.accentDefault,
                    backgroundColor:
                      picked === at ? theme.accentDefault : "transparent",
                  },
                ]}
              />
              <View style={recallStyles.fill}>
                <Markdown text={option.text} />
              </View>
            </TapRow>
          ))}
        </View>
      </CardBox>
      <Button
        label="Check answer"
        off={pick === null}
        busy={busy}
        onPress={() => pick && onCheck(pick.correct === true)}
      />
      {after}
    </>
  );
}

const styles = StyleSheet.create({
  dot: { width: 16, height: 16, borderWidth: 1 },
});
