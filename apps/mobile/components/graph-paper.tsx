import { StyleSheet } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { useTheme } from "../lib/theme";

const MINOR = 24;
const MAJOR = 120;
const LINE_OPACITY = 0.16;

/** The faint grid behind every screen, matching the website's */
export function GraphPaper() {
  const theme = useTheme();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="minor"
          width={MINOR}
          height={MINOR}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d={`M.5 ${MINOR}V.5H${MINOR}`}
            fill="none"
            stroke={theme.borderSubtle}
            strokeOpacity={LINE_OPACITY}
          />
        </Pattern>
        <Pattern
          id="major"
          width={MAJOR}
          height={MAJOR}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d={`M.5 ${MAJOR}V.5H${MAJOR}`}
            fill="none"
            stroke={theme.bgTrack}
            strokeOpacity={LINE_OPACITY}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#minor)" />
      <Rect width="100%" height="100%" fill="url(#major)" />
    </Svg>
  );
}
