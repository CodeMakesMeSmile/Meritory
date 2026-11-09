import { space } from "@meritory/design-tokens";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { GraphPaper } from "./graph-paper";
import { LogoLockup } from "./logo";

/** Graph paper, the logo, and a body that scrolls clear of the keyboard */
export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: theme.bgDesk }]}>
      <GraphPaper />
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.body,
            {
              paddingTop: insets.top + space[6],
              paddingBottom: insets.bottom + space[8],
            },
          ]}
        >
          <LogoLockup />
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: space[4], gap: space[8] },
  content: { gap: space[5] },
});
