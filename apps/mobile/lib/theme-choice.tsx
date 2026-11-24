import * as SecureStore from "expo-secure-store";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type ThemeChoice, ThemeChoiceContext } from "./theme";

const THEME_KEY = "meritory.theme";

/** A stored value as a choice, with anything else meaning Match system */
export function readThemeChoice(value: string | null): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Holds this phone's theme in app state. Appearance.setColorScheme would
 * restart the Android screen and lose anything typed but not saved.
 */
export function ThemeChoiceProvider({ children }: { children: ReactNode }) {
  const [choice, setState] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY)
      .then((stored) => setState(readThemeChoice(stored)))
      // The phone's own setting still works without it
      .catch(() => setState("system"));
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    setState(next);
    const saved =
      next === "system"
        ? SecureStore.deleteItemAsync(THEME_KEY)
        : SecureStore.setItemAsync(THEME_KEY, next);
    // It still applies until the app closes
    saved.catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ choice: choice ?? "system", setChoice }),
    [choice, setChoice],
  );

  // Waits for the stored pick, so the first screen doesn't flash the other theme
  if (choice === null) return null;
  return (
    <ThemeChoiceContext.Provider value={value}>
      {children}
    </ThemeChoiceContext.Provider>
  );
}
