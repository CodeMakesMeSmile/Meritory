import { Pressable } from "react-native";
import { AppText } from "./app-text";

// The text is 20 tall, so this makes the tap area 44
const TAP_AREA = { top: 12, bottom: 12, left: 4, right: 4 };

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
      hitSlop={TAP_AREA}
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
