import {
  HostGrotesk_400Regular,
  HostGrotesk_600SemiBold,
  useFonts,
} from "@expo-google-fonts/host-grotesk";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ProviderSignInProvider } from "../lib/provider-sign-in";
import { SessionProvider, useSession } from "../lib/session";
import { useTheme } from "../lib/theme";

function Routes() {
  const theme = useTheme();
  const { user, loading } = useSession();
  if (loading) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bgDesk },
      }}
    >
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="index" />
        <Stack.Screen name="recall" />
        <Stack.Screen name="interview-date" />
      </Stack.Protected>
      <Stack.Protected guard={user === null}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="check-email" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, failed] = useFonts({
    HostGrotesk_400Regular,
    HostGrotesk_600SemiBold,
    IBMPlexMono_400Regular,
  });
  return (
    <>
      <StatusBar style="auto" />
      {(loaded || failed) && (
        <SessionProvider>
          <ProviderSignInProvider>
            <Routes />
          </ProviderSignInProvider>
        </SessionProvider>
      )}
    </>
  );
}
