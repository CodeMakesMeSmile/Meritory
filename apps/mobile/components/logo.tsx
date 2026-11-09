import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

const MARK_SIZE = 28;
const MARK_GAP = 10;

/** The Steps mark: filled, hatched, and empty squares */
function LogoMark() {
  const { textPrimary } = useTheme();
  return (
    <Svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect x={0} y={17} width={7} height={7} fill={textPrimary} />
      <Rect
        x={9.25}
        y={9.25}
        width={5.5}
        height={5.5}
        stroke={textPrimary}
        strokeWidth={1.5}
      />
      <Path d="M10 14 14 10" stroke={textPrimary} strokeWidth={1} />
      <Rect
        x={17.75}
        y={0.75}
        width={5.5}
        height={5.5}
        stroke={textPrimary}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export function LogoLockup() {
  return (
    <View style={styles.lockup} accessible accessibilityLabel="Meritory">
      <LogoMark />
      <AppText variant="heading2">Meritory</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: "row", alignItems: "center", gap: MARK_GAP },
});
