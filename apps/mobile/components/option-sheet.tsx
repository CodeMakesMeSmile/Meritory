import { space, touchTarget } from "@meritory/design-tokens";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";
import { TextLink } from "./text-link";

export interface SheetOption {
  value: string;
  label: string;
}

/** A list that rises from the bottom, for picking one option of many */
export function OptionSheet({
  title,
  options,
  value,
  onChoose,
  onClose,
}: {
  title: string;
  options: readonly SheetOption[];
  value: string;
  onChoose: (value: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const start = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.scrim}
        accessibilityLabel={`Close ${title.toLowerCase()}`}
        accessibilityRole="button"
        onPress={onClose}
      />
      <View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: theme.bgCard,
            borderTopColor: theme.borderDefault,
            paddingBottom: insets.bottom + space[4],
          },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="heading3" accessibilityRole="header">
            {title}
          </AppText>
          <TextLink label="Cancel" onPress={onClose} />
        </View>
        <FlatList
          data={options}
          keyExtractor={(option) => option.value}
          initialScrollIndex={start}
          getItemLayout={(_, index) => ({
            length: touchTarget,
            offset: touchTarget * index,
            index,
          })}
          renderItem={({ item }) => {
            const picked = item.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: picked }}
                onPress={() => onChoose(item.value)}
                style={[
                  styles.option,
                  picked && { backgroundColor: theme.bgSunken },
                ]}
              >
                <AppText variant={picked ? "bodyStrong" : "body"}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)" },
  sheet: {
    maxHeight: "70%",
    gap: space[2],
    borderTopWidth: 1,
    paddingTop: space[4],
    paddingHorizontal: space[4],
  },
  header: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  option: {
    height: touchTarget,
    justifyContent: "center",
    paddingHorizontal: space[3],
  },
});
