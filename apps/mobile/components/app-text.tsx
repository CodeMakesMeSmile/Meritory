import { textStyles } from "@meritory/design-tokens";
import { Text, type TextProps } from "react-native";
import { useTheme } from "../lib/theme";

const FONT = {
  regular: "HostGrotesk_400Regular",
  strong: "HostGrotesk_600SemiBold",
};

type Variant =
  | "display"
  | "heading2"
  | "body"
  | "bodyStrong"
  | "small"
  | "smallStrong"
  | "link";
type Color = "textPrimary" | "textSecondary" | "textAccent" | "statusDanger";

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

export function AppText({
  variant = "body",
  color = "textPrimary",
  style,
  ...props
}: AppTextProps) {
  const theme = useTheme();
  const text = textStyles[variant];
  return (
    <Text
      style={[
        {
          color: theme[color],
          fontFamily: text.weight === 400 ? FONT.regular : FONT.strong,
          fontSize: text.size,
          lineHeight: text.lineHeight ?? undefined,
          letterSpacing: text.size * text.letterSpacing,
        },
        style,
      ]}
      {...props}
    />
  );
}

export const inputFont = FONT.regular;
