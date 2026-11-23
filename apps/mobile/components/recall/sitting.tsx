import { space, touchTarget } from "@meritory/design-tokens";
import {
  doneLine,
  lineAfterFailedUndo,
  lineAfterSave,
  longWait,
  plural,
  RATING_LABELS,
  type RecallRating,
  type ReviewToSave,
  type SavedRating,
  type SittingCard,
  showsUndo,
  tomorrowLine,
  type UndoLine,
  undoRetryText,
} from "@meritory/recall-client";
import * as Crypto from "expo-crypto";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { recallApi } from "../../lib/api";
import { useTheme } from "../../lib/theme";
import { AppText } from "../app-text";
import { Button } from "../button";
import { CountSquares } from "../count-squares";
import { TextLink } from "../text-link";
import { MatchingCard } from "./matching-card";
import { OrderingCard } from "./ordering-card";
import { CardBox, type Checked, Label } from "./parts";
import { PickOneCard } from "./pick-one-card";
import { PromptCard } from "./prompt-card";

type Saving =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "failed"; review: ReviewToSave; refused: boolean };

function UndoBar({
  line,
  onUndo,
  locked,
}: {
  line: UndoLine;
  onUndo: () => void;
  /** A rating is saving or failed to save, so Undo waits for it */
  locked: boolean;
}) {
  if (line.kind === "kept") {
    return (
      <View style={styles.undo}>
        <AppText variant="small" color="statusDanger">
          {line.text}
        </AppText>
      </View>
    );
  }
  const label = RATING_LABELS[line.rating];
  return (
    <View style={styles.undo}>
      <AppText
        variant="small"
        color={line.offline ? "statusDanger" : "textSecondary"}
      >
        {line.offline ? undoRetryText(line) : `Last card saved as ${label}.`}
      </AppText>
      <TextLink
        label="Undo"
        accessibilityLabel={`Undo the ${label} rating`}
        onPress={() => !line.busy && !locked && onUndo()}
      />
    </View>
  );
}

function Done({
  count,
  saved,
  undo,
  onHome,
}: {
  count: number;
  saved: SavedRating[];
  undo: ReactNode;
  onHome: () => void;
}) {
  const [line, setLine] = useState<string | null>(null);
  const [tomorrow, setTomorrow] = useState<string | null>(null);

  useEffect(() => {
    recallApi.loadDue().then((result) => {
      const now = new Date();
      if (!result.ok) {
        setLine(doneLine(saved, now, null));
        return;
      }
      setLine(doneLine(saved, now, new Date(result.data.dayEndsAt)));
      const newWaiting = result.data.chapters.some((c) => c.new > 0);
      setTomorrow(tomorrowLine(result.data.dueTomorrow, newWaiting));
    });
  }, [saved]);

  return (
    <>
      <View style={styles.bar}>
        <AppText variant="bodyStrong">Recall done</AppText>
        <AppText
          variant="numeric"
          color="textSecondary"
          accessibilityLabel={`${count} of ${count} cards`}
        >
          {count} of {count}
        </AppText>
      </View>
      {undo}
      <CardBox>
        <View accessibilityLiveRegion="polite">
          <AppText variant="display" accessibilityRole="header">
            That's {plural(count, "card")} done
          </AppText>
        </View>
        {line && <AppText>{line}</AppText>}
        {tomorrow && (
          <View style={styles.tight}>
            <Label text="Next up" />
            <AppText>{tomorrow}</AppText>
          </View>
        )}
      </CardBox>
      <Button label="Back to Home" onPress={onHome} />
    </>
  );
}

/** One sitting of due cards, from the first card to the done screen */
export function Sitting({
  items,
  loadedAt,
  onLeave,
  onSignedOut,
}: {
  items: SittingCard[];
  loadedAt: Date;
  onLeave: () => void;
  onSignedOut: () => void;
}) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [saving, setSaving] = useState<Saving>({ state: "idle" });
  const [saved, setSaved] = useState<SavedRating[]>([]);
  const [missedOnce, setMissedOnce] = useState(false);
  const [line, setLine] = useState<UndoLine | null>(null);
  const cardStart = useRef(Date.now());
  // Set before the first await, so a second tap in the same frame waits too
  const inFlight = useRef(false);

  const item = items[index];
  const total = items.length;
  const announce = (text: string) =>
    AccessibilityInfo.announceForAccessibility(text);

  const save = useCallback(
    async (review: ReviewToSave, advance: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaving({ state: "saving" });
      const result = await recallApi.saveReview(review).finally(() => {
        inFlight.current = false;
      });
      if (!result.ok) {
        if (result.reason === "signed_out") {
          onSignedOut();
          return;
        }
        setSaving({
          state: "failed",
          review,
          refused: result.refused === true,
        });
        // Nothing was scheduled, so the card can't say when it comes back
        if (result.refused) setChecked((now) => now && { ...now, wait: null });
        return;
      }
      // Undone since it was sent, so it doesn't count and the sitting moves on
      if (result.data === null) {
        setSaving({ state: "idle" });
        setLine(null);
        if (advance) {
          setIndex((at) => at + 1);
          cardStart.current = Date.now();
        }
        return;
      }
      const { dueAt } = result.data;
      setSaved((list) => [
        ...list,
        {
          chapterTitle:
            items.find((i) => i.session === review.card)?.chapterTitle ?? "",
          dueAt: new Date(dueAt),
        },
      ]);
      setSaving({ state: "idle" });
      AccessibilityInfo.announceForAccessibility(
        `Last card saved as ${RATING_LABELS[review.rating]}.`,
      );
      setLine(lineAfterSave(items, review.card, review.id, review.rating));
      if (advance) {
        setIndex((at) => at + 1);
        cardStart.current = Date.now();
      }
    },
    [items, onSignedOut],
  );

  const review = (rating: RecallRating): ReviewToSave | null =>
    item
      ? {
          id: Crypto.randomUUID(),
          card: item.session,
          rating,
          answeredAt: new Date(),
          durationMs: Date.now() - cardStart.current,
        }
      : null;

  // Missed on a free-answer card shows its lesson before the next card
  function rate(rating: RecallRating) {
    const next = review(rating);
    if (!next || !item || inFlight.current || saving.state !== "idle") return;
    const missed = rating === "again";
    if (missed) {
      setChecked({
        right: false,
        encourage: false,
        wait: longWait(loadedAt, new Date(item.session.next.again)),
      });
    }
    void save(next, !missed);
  }

  function check(right: boolean) {
    if (!item || inFlight.current || saving.state !== "idle") return;
    const rating: RecallRating = right ? "good" : "again";
    setChecked({
      right,
      encourage: !right && !missedOnce,
      wait: longWait(loadedAt, new Date(item.session.next[rating])),
    });
    if (!right) setMissedOnce(true);
    const next = review(rating);
    if (next) void save(next, false);
  }

  function nextCard() {
    setChecked(null);
    setIndex((at) => at + 1);
    cardStart.current = Date.now();
  }

  // Moves on from a rating the API turned down for good, leaving the card as it was
  function skipUnsaved() {
    setSaving({ state: "idle" });
    setLine(null);
    announce("That rating wasn't saved.");
    nextCard();
  }

  async function undo() {
    if (line?.kind !== "offer" || inFlight.current) return;
    if (saving.state !== "idle") return;
    inFlight.current = true;
    setLine({ ...line, busy: true });
    const result = await recallApi.undoReview(line.id).finally(() => {
      inFlight.current = false;
    });
    if (result.ok) {
      setSaved((list) => list.slice(0, -1));
      setLine(null);
      setChecked(null);
      setIndex(line.at);
      cardStart.current = Date.now();
      announce("Rating undone.");
      return;
    }
    if (result.reason === "signed_out") {
      onSignedOut();
      return;
    }
    const next = lineAfterFailedUndo(line, result.code);
    setLine(next);
    announce(next.kind === "kept" ? next.text : undoRetryText(next));
  }

  const undoBar =
    line && showsUndo(line, index) ? (
      <UndoBar
        line={line}
        locked={saving.state !== "idle"}
        onUndo={() => void undo()}
      />
    ) : null;

  if (!item) {
    return (
      <Done
        count={saved.length}
        saved={saved}
        undo={undoBar}
        onHome={onLeave}
      />
    );
  }

  const busy = saving.state !== "idle" || (line?.kind === "offer" && line.busy);
  const failed = saving.state === "failed" ? saving.review : null;
  const refused = saving.state === "failed" && saving.refused;
  const failedBox = (title: string, text: string, action: ReactNode) => (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        styles.failed,
        { borderColor: theme.statusDanger, backgroundColor: theme.bgCard },
      ]}
    >
      <Label text={title} color="statusDanger" />
      <AppText variant="small">{text}</AppText>
      {action}
    </View>
  );
  const after = (
    <>
      {failed &&
        refused &&
        failedBox(
          "That rating can't be saved",
          `We couldn't record ${RATING_LABELS[failed.rating]} for this card, and trying again won't change that. Your earlier answers are saved, and this card stays in your queue.`,
          <Button
            label="Next card"
            variant="secondary"
            onPress={skipUnsaved}
          />,
        )}
      {failed &&
        !refused &&
        failedBox(
          "That rating didn't save",
          `The connection dropped before ${RATING_LABELS[failed.rating]} reached us. Your answer is still here.`,
          <Button
            label="Save again"
            variant="secondary"
            onPress={() =>
              void save(
                failed,
                item.card.type === "prompt" && failed.rating !== "again",
              )
            }
          />,
        )}
      {checked && !failed && (
        <Button
          label="Next card"
          busy={busy}
          onPress={() =>
            !inFlight.current && saving.state === "idle" && nextCard()
          }
        />
      )}
    </>
  );

  const card = item.card;
  const place = `${index + 1} of ${total}`;

  return (
    <>
      <View style={styles.top}>
        <View style={styles.bar}>
          <TextLink label="Stop for now" onPress={onLeave} />
          <AppText
            variant="numeric"
            color="textSecondary"
            accessibilityLabel={`Card ${place}`}
          >
            {place}
          </AppText>
        </View>
        <CountSquares filled={index + 1} total={total} />
      </View>
      {undoBar}
      {card.type === "prompt" ? (
        <PromptCard
          key={item.key}
          item={item}
          card={card}
          now={loadedAt}
          checked={checked}
          saving={busy}
          onRate={rate}
          after={after}
        />
      ) : card.type === "pick-one" ? (
        <PickOneCard
          key={item.key}
          item={item}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
          after={after}
        />
      ) : card.type === "ordering" ? (
        <OrderingCard
          key={item.key}
          item={item}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
          after={after}
        />
      ) : (
        <MatchingCard
          key={item.key}
          item={item}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
          after={after}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  top: { gap: space[4] },
  bar: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  undo: {
    minHeight: touchTarget,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: space[4],
  },
  tight: { gap: space[1] },
  failed: { gap: space[3], borderWidth: 1, padding: space[4] },
});
