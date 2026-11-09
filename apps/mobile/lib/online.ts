import { useNetworkState } from "expo-network";

/** Unknown counts as online, so the buttons don't flicker off at launch */
export function useOnline() {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected !== false && isInternetReachable !== false;
}
