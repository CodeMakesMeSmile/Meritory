import {
  linkedText,
  type Provider,
  type ProviderNotice,
  providerNotice,
} from "@meritory/contracts/sign-in-messages";
import * as Linking from "expo-linking";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { providerReturn } from "./app-link";
import { authClient } from "./auth-client";

interface ProviderSignIn {
  /** The provider whose browser is open */
  opening: Provider | null;
  notice: ProviderNotice | null;
  /** Says a provider was just added to the account */
  linked: string | null;
  open: (provider: Provider) => Promise<void>;
  clear: () => void;
}

const ProviderSignInContext = createContext<ProviderSignIn | null>(null);

export function ProviderSignInProvider({ children }: { children: ReactNode }) {
  const [opening, setOpening] = useState<Provider | null>(null);
  const [notice, setNotice] = useState<ProviderNotice | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  const clear = useCallback(() => {
    setNotice(null);
    setLinked(null);
  }, []);

  async function open(provider: Provider) {
    if (opening) return;
    setOpening(provider);
    clear();
    // Any app can open our links, so only one that returns during this sign-in counts
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const back = providerReturn(url);
      setNotice(providerNotice(back.provider, back.error));
      setLinked(linkedText(back.linked));
    });
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
        errorCallbackURL: "/sign-in",
      });
      if (error) setNotice(providerNotice(provider, "failed"));
    } catch {
      setNotice(providerNotice(provider, "failed"));
    } finally {
      subscription.remove();
      setOpening(null);
    }
  }

  return (
    <ProviderSignInContext value={{ opening, notice, linked, open, clear }}>
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
