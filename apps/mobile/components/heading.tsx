import { space } from "@meritory/design-tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "./app-text";

/** The screen title, with an optional line or two underneath */
export function Heading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.heading}>
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/** "New to Meritory? Create an account", under a title */
export function Switch({ children }: { children: ReactNode }) {
  return <View style={styles.switch}>{children}</View>;
}

const styles = StyleSheet.create({
  heading: { gap: space[2] },
  switch: { flexDirection: "row", alignItems: "center", gap: space[1] },
});
