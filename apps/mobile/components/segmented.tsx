import { space, touchTarget } from "@meritory/design-tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Marks the value we suggest */
  suggested?: boolean;
}

/** Options in a row that work as radio buttons */
export function Segmented<T extends string>({
  label,
  segments,
  value,
  onChange,
}: {
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="smallStrong">{label}</AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.row, { backgroundColor: theme.bgSunken }]}
      >
        {segments.map((segment) => {
          const picked = segment.value === value;
          return (
            <Pressable
              key={segment.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: picked }}
              accessibilityLabel={
                segment.suggested
                  ? `${segment.label}, suggested`
                  : segment.label
              }
              onPress={() => onChange(segment.value)}
              style={[
                styles.segment,
                picked && { backgroundColor: theme.bgCard },
              ]}
            >
              <AppText
                variant={picked ? "smallStrong" : "small"}
                color={picked ? "textPrimary" : "textSecondary"}
              >
                {segment.label}
              </AppText>
              {segment.suggested && (
                <AppText variant="small" color="textSecondary">
                  suggested
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[2] },
  row: { flexDirection: "row", gap: space[1], padding: space[1] },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space[1],
  },
});
