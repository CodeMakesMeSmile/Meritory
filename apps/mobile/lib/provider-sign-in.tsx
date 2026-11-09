import type { Provider } from "@meritory/contracts/sign-in-messages";
import { createContext, type ReactNode, useContext, useState } from "react";
import { authClient } from "./auth-client";

interface ProviderSignIn {
  /** The provider whose browser is open */
  opening: Provider | null;
  open: (provider: Provider) => Promise<void>;
}

const ProviderSignInContext = createContext<ProviderSignIn | null>(null);

export function ProviderSignInProvider({ children }: { children: ReactNode }) {
  const [opening, setOpening] = useState<Provider | null>(null);

  async function open(provider: Provider) {
    if (opening) return;
    setOpening(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
        errorCallbackURL: "/sign-in",
      });
    } finally {
      setOpening(null);
    }
  }

  return (
    <ProviderSignInContext value={{ opening, open }}>
      {children}
    </ProviderSignInContext>
  );
}

export function useProviderSignIn() {
  const value = useContext(ProviderSignInContext);
  if (!value) {
    throw new Error("useProviderSignIn needs a ProviderSignInProvider.");
  }
  return value;
}
