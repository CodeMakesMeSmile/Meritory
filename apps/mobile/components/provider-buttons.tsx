import {
  PROVIDER_IDS,
  PROVIDER_LABELS,
  type Provider,
} from "@meritory/contracts/sign-in-messages";
import { controlHeight, radius, space } from "@meritory/design-tokens";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useOnline } from "../lib/online";
import { useProviderSignIn } from "../lib/provider-sign-in";
import { useTheme } from "../lib/theme";
import { AppText } from "./app-text";

const LOGO_SIZE = 18;
const LOGO_GAP = 10;
const OFF_OPACITY = 0.38;

// Google's button colors, which sit outside our palette
const LOOK = {
  light: { fill: "#ffffff", stroke: "#747775", text: "#1f1f1f" },
  dark: { fill: "#131314", stroke: "#8e918f", text: "#e3e3e3" },
};

function GitHubLogo({ color }: { color: string }) {
  return (
    <Svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 18 18">
      <Path
        fill={color}
        d="M9 0c4.97 0 9 4.03 9 9a9 9 0 0 1-6.13 8.54c-.45.09-.62-.19-.62-.43 0-.3.01-1.27.01-2.47 0-.84-.28-1.38-.6-1.67 2-.22 4.1-.99 4.1-4.44 0-.99-.35-1.79-.92-2.42.09-.22.4-1.15-.09-2.38 0 0-.75-.25-2.47.92a8.5 8.5 0 0 0-4.5 0C5.05 3.49 4.3 3.72 4.3 3.72c-.5 1.24-.18 2.16-.09 2.39-.58.63-.92 1.44-.92 2.42 0 3.44 2.09 4.22 4.09 4.44-.26.23-.49.62-.57 1.2-.52.24-1.81.62-2.62-.74-.17-.27-.67-.93-1.38-.92-.75.01-.3.43.01.6.38.21.82 1.01.92 1.27.18.5.77 1.48 3.03 1.06 0 .75.01 1.46.01 1.68 0 .24-.17.51-.62.43A9 9 0 0 1 0 9c0-4.97 4.03-9 9-9Z"
      />
    </Svg>
  );
}

function GoogleLogo() {
  return (
    <Svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 18 18">
      <Path
        fill="#EA4335"
        d="M9 3.56c1.33 0 2.52.46 3.45 1.35l2.57-2.57A8.6 8.6 0 0 0 9 0C5.48 0 2.44 2.02.96 4.96l2.99 2.32A5.4 5.4 0 0 1 9 3.56Z"
      />
      <Path
        fill="#4285F4"
        d="M17.62 9.21c0-.59-.06-1.16-.15-1.71H9v3.38h4.85a4.14 4.14 0 0 1-1.79 2.7l2.9 2.24c1.69-1.57 2.66-3.89 2.66-6.61Z"
      />
      <Path
        fill="#FBBC05"
        d="M3.95 10.72A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.29-1.72L.96 4.96A9 9 0 0 0 0 9c0 1.46.35 2.83.96 4.04l2.99-2.32Z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.54-1.84.86-3.06.86a5.4 5.4 0 0 1-5.05-3.71L.96 13.04A9 9 0 0 0 9 18Z"
      />
    </Svg>
  );
}

function ProviderButton({
  provider,
  off,
  onPress,
}: {
  provider: Provider;
  off: boolean;
  onPress: () => void;
}) {
  const look = LOOK[useColorScheme() === "dark" ? "dark" : "light"];
  const label = `Continue with ${PROVIDER_LABELS[provider]}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: look.fill,
          borderColor: look.stroke,
          opacity: off ? OFF_OPACITY : 1,
        },
      ]}
    >
      {provider === "github" ? (
        <GitHubLogo color={look.text} />
      ) : (
        <GoogleLogo />
      )}
      <Text style={[styles.label, { color: look.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Continue with GitHub or Google. Both stay off while one is open. */
export function ProviderButtons({ disabled = false }: { disabled?: boolean }) {
  const online = useOnline();
  const { opening, open } = useProviderSignIn();
  return (
    <View style={styles.buttons}>
      {PROVIDER_IDS.map((provider) => (
        <ProviderButton
          key={provider}
          provider={provider}
          off={disabled || !online || opening !== null}
          onPress={() => void open(provider)}
        />
      ))}
    </View>
  );
}

/** The thin rule with "or" between the providers and the form */
export function OrDivider() {
  const { borderSubtle } = useTheme();
  const rule = [styles.rule, { backgroundColor: borderSubtle }];
  return (
    <View style={styles.divider}>
      <View style={rule} />
      <AppText variant="small" color="textSecondary">
        or
      </AppText>
      <View style={rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space[2] },
  button: {
    height: controlHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: LOGO_GAP,
    paddingHorizontal: space[3],
    borderWidth: 1,
    borderRadius: radius.control,
  },
  // Roboto Medium, as Google's button rules ask for
  label: { fontFamily: "sans-serif-medium", fontSize: 14, lineHeight: 20 },
  divider: { flexDirection: "row", alignItems: "center", gap: space[3] },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
});
