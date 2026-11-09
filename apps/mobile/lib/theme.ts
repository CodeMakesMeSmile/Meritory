import { colors } from "@meritory/design-tokens";
import { useColorScheme } from "react-native";

export function useTheme() {
  return colors[useColorScheme() === "dark" ? "dark" : "light"];
}
