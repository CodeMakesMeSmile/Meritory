import type { OAuth2Tokens } from "better-auth";
import type { GithubProfile } from "better-auth/social-providers";

export const PROVIDERS = ["github", "google"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  github: "GitHub",
  google: "Google",
};

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

export type ProviderConfig = Partial<Record<Provider, ProviderCredentials>>;

export function isProvider(value: unknown): value is Provider {
  return PROVIDERS.includes(value as Provider);
}

const MAX_NAME_LENGTH = 100;

/**
 * Applies the sign-up name rule to a name from GitHub or Google. Control characters become
 * spaces, and an empty result falls back to the login or the email's first part.
 */
export function providerName(raw: unknown, fallback: string): string {
  const clean = (value: unknown) =>
    typeof value === "string"
      ? value
          .replace(/\p{Cc}/gu, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, MAX_NAME_LENGTH)
      : "";
  return clean(raw) || clean(fallback) || "Meritory learner";
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * Better Auth's own lookup takes the public email even when it isn't the verified primary.
 * This takes only the verified primary, and leaves the email empty without one, so the
 * callback refuses with email_not_found.
 */
export async function githubUserInfo(
  token: OAuth2Tokens,
  fetcher: typeof fetch = fetch,
) {
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token.accessToken}`,
    "user-agent": "Meritory",
  };
  const [profileRes, emailsRes] = await Promise.all([
    fetcher("https://api.github.com/user", { headers }),
    fetcher("https://api.github.com/user/emails", { headers }),
  ]);
  if (!profileRes.ok || !emailsRes.ok) return null;
  const profile = (await profileRes.json()) as GithubProfile;
  const emails = (await emailsRes.json()) as unknown;
  const primary = Array.isArray(emails)
    ? (emails as GitHubEmail[]).find((e) => e.primary && e.verified)
    : undefined;
  return {
    user: {
      name: providerName(profile.name, profile.login),
      email: primary?.email ?? null,
      emailVerified: primary !== undefined,
      image: profile.avatar_url,
    },
    data: profile,
  };
}

/** Builds Better Auth's providers from whichever have credentials */
export function socialProviders(config: ProviderConfig = {}) {
  return {
    ...(config.github && {
      github: {
        ...config.github,
        getUserInfo: (token: OAuth2Tokens) => githubUserInfo(token),
      },
    }),
    ...(config.google && {
      google: {
        ...config.google,
        // The ticket asks for the account picker every time
        prompt: "select_account" as const,
        mapProfileToUser: (profile: { name?: string; email?: string }) => ({
          name: providerName(profile.name, profile.email?.split("@")[0] ?? ""),
        }),
      },
    }),
  };
}

/** Sign-in never keeps GitHub or Google tokens, since nothing calls their APIs */
export function withoutTokens<T extends object>(account: T): T {
  return {
    ...account,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  };
}

const ORIGINLESS = "http://origin.invalid";

/** The landing path with `linked` set, so the page can say the provider was just added */
export function withLinked(location: string, provider: Provider) {
  const url = new URL(location, ORIGINLESS);
  url.searchParams.set("linked", provider);
  return url.origin === ORIGINLESS
    ? `${url.pathname}${url.search}${url.hash}`
    : url.toString();
}

const SAME_SITE_PATH = /^\/(?![/\\])/;
// Pages that can show a provider's error, with the provider named
const ERROR_PAGES = ["/sign-in", "/account"] as const;

/**
 * Where a provider sends people back. The success path must be a path on this site, and
 * errors only land on sign in or Account.
 */
export function providerRedirects(
  provider: Provider,
  body: { callbackURL?: unknown; errorCallbackURL?: unknown },
) {
  const callbackURL =
    typeof body.callbackURL === "string" &&
    SAME_SITE_PATH.test(body.callbackURL) &&
    !/[\\\p{Cc}]/u.test(body.callbackURL)
      ? body.callbackURL
      : "/";
  const page =
    ERROR_PAGES.find((path) => path === body.errorCallbackURL) ?? "/sign-in";
  return {
    callbackURL,
    errorCallbackURL: `${page}?provider=${provider}`,
    // Hook bodies merge without undefined values, so this repeats the success path
    newUserCallbackURL: callbackURL,
  };
}
