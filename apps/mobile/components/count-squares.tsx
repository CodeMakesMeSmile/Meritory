import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme";

/** A count drawn as squares: filled for done, outlined for the rest */
export function CountSquares({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const theme = useTheme();
  const done = Math.max(0, Math.min(filled, total));
  return (
    // The count is always said in words next to it
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.square,
            {
              borderColor: theme.accentDefault,
              backgroundColor:
                index < done ? theme.accentDefault : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  square: { width: 8, height: 8, borderWidth: 1 },
});
