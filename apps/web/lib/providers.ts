import { PROVIDER_IDS } from "@meritory/contracts";

export type Provider = (typeof PROVIDER_IDS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  github: "GitHub",
  google: "Google",
};

export function isProvider(value: unknown): value is Provider {
  return PROVIDER_IDS.includes(value as Provider);
}

export interface ProviderNotice {
  tone: "info" | "danger";
  text: string;
  /** Offer the reset, which confirms an account that isn't confirmed */
  reset?: boolean;
}

/** What to say when ?linked= says a provider was just added to the account */
export function linkedText(linked: string | string[] | undefined) {
  if (!isProvider(linked)) return null;
  return `${PROVIDER_LABELS[linked]} is now linked to your account. You can sign in with it too.`;
}

/** What to say when GitHub or Google sends someone back with ?error= */
export function providerNotice(
  provider: string | string[] | undefined,
  error: string | string[] | undefined,
  page: "sign-in" | "account" = "sign-in",
): ProviderNotice | null {
  if (typeof error !== "string" || !isProvider(provider)) return null;
  const label = PROVIDER_LABELS[provider];
  switch (error) {
    case "access_denied":
      return {
        tone: "info",
        text: `You cancelled signing in with ${label}. ${page === "account" ? "Nothing changed." : "Nothing was created."}`,
      };
    case "email_not_found":
    case "email_not_verified":
      return {
        tone: "danger",
        text: `Your ${label} account has no verified email. Verify one on ${label}, then try again.`,
      };
    case "account_not_linked":
      return {
        tone: "info",
        text: `There's already an account with this email that isn't confirmed. Reset its password to confirm it, then continue with ${label}.`,
        reset: true,
      };
    default:
      return {
        tone: "danger",
        text: `${label} sign-in didn't work. Try again.`,
      };
  }
}
