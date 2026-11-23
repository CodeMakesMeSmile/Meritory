import { controlHeight, space } from "@meritory/design-tokens";
import { dayName } from "@meritory/recall-client";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addMonths,
  dayOfMonth,
  isBefore,
  monthIsPast,
  monthLabel,
  monthOf,
  monthRows,
} from "../lib/calendar";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";
import { Button } from "./button";
import { TextLink } from "./text-link";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** A calendar that rises from the bottom, for picking today or a later day */
export function DateSheet({
  open,
  value,
  today,
  onChoose,
  onClose,
}: {
  open: boolean;
  /** The date already in the field, as YYYY-MM-DD */
  value: string | null;
  today: string;
  onChoose: (date: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const start = value && !isBefore(value, today) ? value : today;
  const [month, setMonth] = useState(() => monthOf(start));
  const [picked, setPicked] = useState<string | null>(
    value && !isBefore(value, today) ? value : null,
  );
  const canGoBack = !monthIsPast(addMonths(month, -1), today);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.scrim}
        accessibilityLabel="Close the calendar"
        accessibilityRole="button"
        onPress={onClose}
      />
      <View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: theme.bgCard,
            borderTopColor: theme.borderDefault,
            paddingBottom: insets.bottom + space[4],
          },
        ]}
      >
        <View style={styles.header}>
          {canGoBack ? (
            <TextLink
              label="Previous"
              accessibilityLabel="Previous month"
              onPress={() => setMonth(addMonths(month, -1))}
            />
          ) : (
            <View style={styles.side} />
          )}
          <AppText
            variant="bodyStrong"
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
          >
            {monthLabel(month)}
          </AppText>
          <TextLink
            label="Next"
            accessibilityLabel="Next month"
            onPress={() => setMonth(addMonths(month, 1))}
          />
        </View>
        <View style={styles.week}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.cell}>
              <AppText variant="numeric" color="textSecondary">
                {day}
              </AppText>
            </View>
          ))}
        </View>
        {monthRows(month).map((row, at) => (
          <View key={at} style={styles.week}>
            {row.map((date, weekday) => {
              if (!date) return <View key={weekday} style={styles.cell} />;
              const past = isBefore(date, today);
              const selected = date === picked;
              return (
                <Pressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAY_NAMES[weekday]}, ${dayName(date)}${date === today ? ", today" : ""}`}
                  accessibilityState={{ disabled: past, selected }}
                  disabled={past}
                  onPress={() => setPicked(date)}
                  style={[
                    styles.cell,
                    date === today && {
                      borderWidth: 1,
                      borderColor: theme.borderDefault,
                    },
                    selected && {
                      borderWidth: 2,
                      borderColor: theme.accentDefault,
                      backgroundColor: theme.highlightSoft,
                    },
                  ]}
                >
                  <AppText
                    variant="numeric"
                    color={past ? "textSecondary" : "textPrimary"}
                  >
                    {dayOfMonth(date)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ))}
        <AppText variant="small" color="textSecondary">
          Past dates can't be picked. Today is boxed.
        </AppText>
        <View style={styles.actions}>
          <TextLink label="Cancel" onPress={onClose} />
          <View style={styles.choose}>
            <Button
              label={picked ? `Choose ${dayName(picked)}` : "Choose a date"}
              off={picked === null}
              onPress={() => picked && onChoose(picked)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)" },
  sheet: {
    gap: space[2],
    borderTopWidth: 1,
    paddingTop: space[4],
    paddingHorizontal: space[4],
  },
  header: {
    minHeight: controlHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: { width: 64 },
  week: { flexDirection: "row", justifyContent: "space-between" },
  cell: {
    width: controlHeight,
    height: controlHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: space[6],
    paddingTop: space[2],
  },
  choose: { minWidth: 200 },
});
