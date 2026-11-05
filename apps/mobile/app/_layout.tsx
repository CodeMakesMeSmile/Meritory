import { colors } from "@meritory/design-tokens";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const theme = colors[useColorScheme() === "dark" ? "dark" : "light"];

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bgDesk },
        }}
      />
    </>
  );
}
