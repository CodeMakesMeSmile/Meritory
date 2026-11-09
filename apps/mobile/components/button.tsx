import { controlHeight, radius, space } from "@meritory/design-tokens";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  /** Ignores taps but keeps its normal look, so it doesn't flash grey */
  busy?: boolean;
  /** Greyed out, for offline and for a countdown */
  off?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  busy = false,
  off = false,
}: ButtonProps) {
  const theme = useTheme();
  const look =
    variant === "primary"
      ? {
          on: theme.accentDefault,
          onBorder: theme.accentDefault,
          onText: theme.textOnAccent,
          off: theme.bgTrack,
          offBorder: theme.bgTrack,
        }
      : {
          on: theme.bgCard,
          onBorder: theme.borderDefault,
          onText: theme.textPrimary,
          off: theme.bgCard,
          offBorder: theme.borderSubtle,
        };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }}
      disabled={off || busy}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: off ? look.off : look.on,
          borderColor: off ? look.offBorder : look.onBorder,
        },
      ]}
    >
      <AppText
        variant="bodyStrong"
        style={{ color: off ? theme.textSecondary : look.onText }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: controlHeight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[5],
    borderWidth: 1,
    borderRadius: radius.control,
  },
});
