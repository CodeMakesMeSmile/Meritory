import { colors, radius, space, textStyles } from "@meritory/design-tokens";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const theme = colors[useColorScheme() === "dark" ? "dark" : "light"];

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.bgCard, borderColor: theme.borderDefault },
        ]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Meritory
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Mobile app is running.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: space[4] },
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[2],
  },
  title: {
    fontSize: textStyles.display.size,
    lineHeight: textStyles.display.lineHeight,
    fontWeight: "600",
    letterSpacing: textStyles.display.size * textStyles.display.letterSpacing,
  },
  body: {
    fontSize: textStyles.body.size,
    lineHeight: textStyles.body.lineHeight,
  },
});
