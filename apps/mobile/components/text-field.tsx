import { controlHeight, radius, space } from "@meritory/design-tokens";
import { type ComponentRef, type ReactNode, type Ref, useState } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";
import { useTheme } from "../lib/theme";
import { AppText, inputFont } from "./app-text";

export type FieldRef = ComponentRef<typeof TextInput>;

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  helper?: string;
  error?: string;
  /** Sits at the end of the label row */
  aside?: ReactNode;
  /** Sits inside the box, after the input */
  trailing?: ReactNode;
  /** Sits between the box and the helper text */
  below?: ReactNode;
  ref?: Ref<FieldRef>;
}

export function TextField({
  label,
  helper,
  error,
  aside,
  trailing,
  below,
  ref,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderWidth = focused || error ? 2 : 1;
  let borderColor: string = theme.borderDefault;
  if (focused) borderColor = theme.accentDefault;
  if (error) borderColor = theme.statusDanger;
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText variant="smallStrong">{label}</AppText>
        {aside}
      </View>
      <View
        style={[
          styles.box,
          {
            backgroundColor: theme.bgCard,
            borderColor,
            borderWidth,
            // Keeps the text still when the border thickens
            paddingHorizontal: space[3] - borderWidth + 1,
          },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error}
          selectionColor={theme.textPrimary}
          style={[styles.input, { color: theme.textPrimary }]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...input}
        />
        {trailing}
      </View>
      {below}
      {(error || helper) && (
        <AppText
          variant="small"
          color={error ? "statusDanger" : "textSecondary"}
          accessibilityLiveRegion={error ? "polite" : "none"}
        >
          {error ?? helper}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[2] },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[4],
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    height: controlHeight,
    borderRadius: radius.control,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: inputFont,
    fontSize: 16,
  },
});
