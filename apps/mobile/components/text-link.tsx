import { touchTarget } from "@meritory/design-tokens";
import { Pressable, StyleSheet } from "react-native";
import { AppText } from "./app-text";

export function TextLink({
  label,
  accessibilityLabel,
  accessibilityHint,
  role = "button",
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** "link" when it leaves the app */
  role?: "button" | "link";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.link}
      onPress={onPress}
    >
      <AppText variant="link" color="textAccent">
        {label}
      </AppText>
    </Pressable>
  );
}

export function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <TextLink
      label={shown ? "Hide" : "Show"}
      accessibilityLabel={shown ? "Hide password" : "Show password"}
      onPress={onToggle}
    />
  );
}

const styles = StyleSheet.create({
  // Real bounds, not hitSlop, so Accessibility Scanner sees the full target
  link: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    justifyContent: "center",
  },
});
