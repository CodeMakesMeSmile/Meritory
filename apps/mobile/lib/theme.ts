import { colors } from "@meritory/design-tokens";
import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

export type ThemeChoice = "system" | "light" | "dark";

export interface ThemeChoiceState {
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
}

export const ThemeChoiceContext = createContext<ThemeChoiceState>({
  choice: "system",
  setChoice: () => {},
});

/** This phone's pick, and a way to change it */
export const useThemeChoice = () => useContext(ThemeChoiceContext);

/** Light or dark, from this phone's pick or else the system's */
export function useScheme(): "light" | "dark" {
  const system = useColorScheme();
  const { choice } = useThemeChoice();
  if (choice !== "system") return choice;
  return system === "dark" ? "dark" : "light";
}

export function useTheme() {
  return colors[useScheme()];
}
