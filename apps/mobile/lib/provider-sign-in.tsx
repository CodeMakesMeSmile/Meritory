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
import { createCodeTrades, freshLink } from "./code-trades";
import { createPkce } from "./pkce";

/** Trades the code from the app's link, plus this sign-in's verifier, for the session */
async function redeem(code: string, verifier: string) {
  const { error } = await authClient.$fetch("/app-session", {
    method: "POST",
    body: { code, verifier },
  });
  return !error;
}

// The real return comes as the browser closes, so a short wait is enough after a wrong code
const RETURN_WAIT_MS = 5_000;

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
    const failed = () => {
      setLinked(null);
      setNotice(providerNotice(provider, "failed"));
    };
    try {
      const { verifier, challenge } = await createPkce();
      const trades = createCodeTrades((code) => redeem(code, verifier));
      const onLink = (url: string) => {
        const back = providerReturn(url);
        setNotice(providerNotice(back.provider, back.error));
        setLinked(linkedText(back.linked));
        if (back.code) trades.offer(back.code);
      };
      const launchLink = () => Linking.getInitialURL().catch(() => null);
      const before = await launchLink();
      // Any app can open our links, so only one that returns during this sign-in counts
      const subscription = Linking.addEventListener("url", ({ url }) =>
        onLink(url),
      );
      try {
        const { error } = await authClient.signIn.social({
          provider,
          callbackURL: "/",
          errorCallbackURL: "/sign-in",
          additionalData: { appCodeChallenge: challenge },
        });
        if (error) failed();
        // A return that restarts the screen arrives as the launch link, with no event
        const restarted = freshLink(before, await launchLink());
        if (restarted) onLink(restarted);
        if (trades.started && !(await trades.result(RETURN_WAIT_MS))) failed();
      } finally {
        subscription.remove();
      }
    } catch {
      failed();
    } finally {
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
