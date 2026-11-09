import { space } from "@meritory/design-tokens";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

const BORDERS = {
  success: "statusSuccess",
  info: "borderDefault",
  danger: "statusDanger",
} as const;

export function Alert({
  tone,
  text,
}: {
  tone: keyof typeof BORDERS;
  text: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion={tone === "danger" ? "assertive" : "polite"}
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      style={[
        styles.alert,
        { backgroundColor: theme.bgCard, borderColor: theme[BORDERS[tone]] },
      ]}
    >
      <AppText variant="small">{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { borderWidth: 1, padding: space[3] },
});
