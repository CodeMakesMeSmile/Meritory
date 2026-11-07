import { useSyncExternalStore } from "react";
import { SIGN_UP_EMAIL_KEY } from "./auth-client";

function readEmail(): string | null {
  try {
    return sessionStorage.getItem(SIGN_UP_EMAIL_KEY);
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

/** The address from the sign-up form in this tab, never from the URL */
export function useSignUpEmail() {
  return useSyncExternalStore(noSubscription, readEmail, () => null);
}
