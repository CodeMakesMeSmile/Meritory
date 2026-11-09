import { Pressable } from "react-native";
import { AppText } from "./app-text";

// The text is 20 tall, so this makes the tap area 44
const TAP_AREA = { top: 12, bottom: 12, left: 4, right: 4 };

export function TextLink({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
