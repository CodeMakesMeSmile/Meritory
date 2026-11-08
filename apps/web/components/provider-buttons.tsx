"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { PROVIDER_LABELS, type Provider } from "@/lib/providers";

function GitHubLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 0c4.97 0 9 4.03 9 9a9 9 0 0 1-6.13 8.54c-.45.09-.62-.19-.62-.43 0-.3.01-1.27.01-2.47 0-.84-.28-1.38-.6-1.67 2-.22 4.1-.99 4.1-4.44 0-.99-.35-1.79-.92-2.42.09-.22.4-1.15-.09-2.38 0 0-.75-.25-2.47.92a8.5 8.5 0 0 0-4.5 0C5.05 3.49 4.3 3.72 4.3 3.72c-.5 1.24-.18 2.16-.09 2.39-.58.63-.92 1.44-.92 2.42 0 3.44 2.09 4.22 4.09 4.44-.26.23-.49.62-.57 1.2-.52.24-1.81.62-2.62-.74-.17-.27-.67-.93-1.38-.92-.75.01-.3.43.01.6.38.21.82 1.01.92 1.27.18.5.77 1.48 3.03 1.06 0 .75.01 1.46.01 1.68 0 .24-.17.51-.62.43A9 9 0 0 1 0 9c0-4.97 4.03-9 9-9Z"
      />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 3.56c1.33 0 2.52.46 3.45 1.35l2.57-2.57A8.6 8.6 0 0 0 9 0C5.48 0 2.44 2.02.96 4.96l2.99 2.32A5.4 5.4 0 0 1 9 3.56Z"
      />
      <path
        fill="#4285F4"
        d="M17.62 9.21c0-.59-.06-1.16-.15-1.71H9v3.38h4.85a4.14 4.14 0 0 1-1.79 2.7l2.9 2.24c1.69-1.57 2.66-3.89 2.66-6.61Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.72A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.29-1.72L.96 4.96A9 9 0 0 0 0 9c0 1.46.35 2.83.96 4.04l2.99-2.32Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.54-1.84.86-3.06.86a5.4 5.4 0 0 1-5.05-3.71L.96 13.04A9 9 0 0 0 9 18Z"
      />
    </svg>
  );
}

const LOGOS: Record<Provider, () => React.JSX.Element> = {
  github: GitHubLogo,
  google: GoogleLogo,
};

interface ProviderButtonsProps {
  /** Where to land after signing in, a path on this site */
  callbackURL: string;
  /** Which page shows the error if the provider sends one back */
  errorPage: "/sign-in" | "/account";
  /** Only these providers, in this order */
  providers?: readonly Provider[];
  /** Runs just before the page leaves for the provider */
  onLeave?: () => void;
  /** The browser couldn't reach the sign-in route */
  onFailed?: (provider: Provider) => void;
  disabled?: boolean;
}

/** Continue with GitHub or Google. Every button stays off while one is opening. */
export function ProviderButtons({
  callbackURL,
  errorPage,
  providers = ["github", "google"],
  onLeave,
  onFailed,
  disabled = false,
}: ProviderButtonsProps) {
  const [opening, setOpening] = useState<Provider | null>(null);

  async function open(provider: Provider) {
    if (opening) return;
    setOpening(provider);
    onLeave?.();
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: errorPage,
      });
      if (!error) return;
    } catch {
      // Falls through to the failure below
    }
    setOpening(null);
    onFailed?.(provider);
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:auto-cols-fr sm:grid-flow-col">
      {providers.map((provider) => {
        const Logo = LOGOS[provider];
        const label = PROVIDER_LABELS[provider];
        return (
          <button
            key={provider}
            type="button"
            className="provider-button focus-ring"
            disabled={disabled || opening !== null}
            aria-busy={opening === provider}
            onClick={() => void open(provider)}
          >
            <Logo />
            {opening === provider
              ? `Opening ${label}`
              : `Continue with ${label}`}
          </button>
        );
      })}
    </div>
  );
}

/** The thin rule with "or" between the providers and the form */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-small text-secondary">
      <span className="h-px flex-1 bg-border-subtle" />
      or
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
