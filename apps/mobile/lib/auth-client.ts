import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** The website origin, which also serves the API at /api/v1 */
export function webOrigin() {
  const configured = process.env.EXPO_PUBLIC_WEB_ORIGIN;
  if (configured) return configured;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (__DEV__ && host) return `http://${host}:3000`;
  throw new Error("EXPO_PUBLIC_WEB_ORIGIN is not set.");
}

/** Shows as "Meritory app on Android" in the list of sessions */
function userAgent() {
  const version = Constants.expoConfig?.version ?? "0.0.0";
  const system =
    Platform.OS === "android"
      ? `Android ${Platform.constants.Release}`
      : `iPhone ${Platform.Version}`;
  return `Meritory/${version} (${system})`;
}

export const authClient = createAuthClient({
  baseURL: webOrigin(),
  basePath: "/api/v1/auth",
  fetchOptions: { headers: { "User-Agent": userAgent() } },
  plugins: [
    expoClient({
      scheme: "app.meritory.mobile",
      storagePrefix: "meritory",
      storage: SecureStore,
    }),
  ],
});
