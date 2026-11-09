import { space } from "@meritory/design-tokens";
import type { Strength } from "@meritory/password";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

const FILLED = {
  weak: { bars: 1, color: "statusDanger" },
  fair: { bars: 2, color: "statusWarning" },
  good: { bars: 3, color: "statusSuccess" },
  strong: { bars: 4, color: "statusSuccess" },
} as const;

export function StrengthMeter({
  strength,
  message,
}: {
  strength: Strength | null;
  message: string;
}) {
  const theme = useTheme();
  const filled = strength ? FILLED[strength] : null;
  return (
    <View style={styles.meter}>
      <View style={styles.bars} importantForAccessibility="no-hide-descendants">
        {[0, 1, 2, 3].map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                backgroundColor:
                  filled && bar < filled.bars
                    ? theme[filled.color]
                    : theme.bgTrack,
              },
            ]}
          />
        ))}
      </View>
      <AppText
        variant="small"
        color="textSecondary"
        accessibilityLiveRegion="polite"
      >
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { gap: space[2] },
  bars: { flexDirection: "row", gap: space[1] },
  bar: { flex: 1, height: space[1] },
});
