import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";

export type ThemeChoice = "system" | "light" | "dark";

const THEME_KEY = "meritory.theme";

/** A stored value as a choice, with anything else meaning Match system */
export function readThemeChoice(value: string | null): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

function apply(choice: ThemeChoice) {
  Appearance.setColorScheme(choice === "system" ? "auto" : choice);
}

/** Puts back this phone's pick at launch, before the first screen draws */
export async function restoreThemeChoice(): Promise<ThemeChoice> {
  let stored: string | null = null;
  try {
    stored = await SecureStore.getItemAsync(THEME_KEY);
  } catch {
    // The phone's own setting still works without it
  }
  const choice = readThemeChoice(stored);
  apply(choice);
  return choice;
}

/** Saves the pick on this phone and repaints now */
export async function setThemeChoice(choice: ThemeChoice): Promise<void> {
  apply(choice);
  try {
    if (choice === "system") await SecureStore.deleteItemAsync(THEME_KEY);
    else await SecureStore.setItemAsync(THEME_KEY, choice);
  } catch {
    // It still applies until the app closes
  }
}

/** What this phone picked, for the Theme control */
export async function currentThemeChoice(): Promise<ThemeChoice> {
  try {
    return readThemeChoice(await SecureStore.getItemAsync(THEME_KEY));
  } catch {
    return "system";
  }
}
