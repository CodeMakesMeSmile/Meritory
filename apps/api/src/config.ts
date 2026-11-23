import { fileURLToPath } from "node:url";
import { type ProviderConfig, readMailKey } from "@meritory/server";

export interface ApiConfig {
  port: number;
  host: string;
  databaseUrl: string;
  logLevel: string;
  webOrigin: string;
  /** Browsers and the phone reach the API under the web origin */
  publicApiUrl: string;
  authSecret: string;
  appScheme: string;
  expoGoScheme?: string;
  ipAddressHeaders?: string[];
  trustedProxies?: string[];
  /** Seals queued emails, since they hold sign-in links */
  mailJobKey: Buffer;
  /** Each provider turns on once both its ID and secret are set */
  providers: ProviderConfig;
  /** Asks Have I Been Pwned about new passwords */
  breachCheck: boolean;
  /** The bundle `pnpm content:build` writes */
  contentBundlePath: string;
  /** The code runner inside WSL2, set only once both are, see docs/runner.md */
  runner?: { url: string; token: string };
}

const BUILT_BUNDLE = fileURLToPath(
  new URL("../../../packages/content/dist/bundle.json", import.meta.url),
);

const MIN_SECRET_LENGTH = 32;

function list(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function credentials(clientId?: string, clientSecret?: string) {
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

// On in production unless turned off, off elsewhere so tests and offline work don't call out
function readBreachCheck(env: Record<string, string | undefined>): boolean {
  const value = env.BREACHED_PASSWORD_CHECK;
  if (value === undefined || value === "") return env.NODE_ENV === "production";
  if (value === "on") return true;
  if (value === "off") return false;
  throw new Error('BREACHED_PASSWORD_CHECK must be "on" or "off".');
}

function readWebOrigin(env: Record<string, string | undefined>): string {
  const production = env.NODE_ENV === "production";
  const value =
    env.WEB_ORIGIN ?? (production ? undefined : "http://localhost:3000");
  if (!value) throw new Error("WEB_ORIGIN is not set.");
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (production && (local || url.protocol !== "https:")) {
    throw new Error("WEB_ORIGIN must be a public https origin in production.");
  }
  return url.origin;
}

// Any client can send this one, so on its own it proves nothing
const FORGEABLE_HEADER = "x-forwarded-for";

// Without a trusted proxy or a header only the edge sets, a forged header picks the address
function readClientIp(env: Record<string, string | undefined>) {
  const ipAddressHeaders = list(env.AUTH_IP_HEADERS);
  const trustedProxies = list(env.AUTH_TRUSTED_PROXIES);
  const edgeHeader = ipAddressHeaders?.some(
    (header) => header.toLowerCase() !== FORGEABLE_HEADER,
  );
  if (env.NODE_ENV === "production" && !edgeHeader && !trustedProxies?.length) {
    throw new Error(
      "Set AUTH_TRUSTED_PROXIES, or AUTH_IP_HEADERS to a header only the edge sets, in production, so rate limits count each client.",
    );
  }
  return { ipAddressHeaders, trustedProxies };
}

export function readConfig(env: Record<string, string | undefined>): ApiConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env first.",
    );
  }
  const authSecret = env.BETTER_AUTH_SECRET ?? "";
  if (authSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }
  const webOrigin = readWebOrigin(env);
  return {
    port: Number(env.API_PORT ?? env.PORT ?? 4000),
    // Containers set API_HOST=0.0.0.0. Locally, stay off the network.
    host: env.API_HOST ?? "127.0.0.1",
    databaseUrl,
    logLevel: env.LOG_LEVEL ?? "info",
    webOrigin,
    publicApiUrl: `${webOrigin}/api`,
    authSecret,
    appScheme: "app.meritory.mobile://",
    expoGoScheme: env.NODE_ENV === "production" ? undefined : "exp://",
    ...readClientIp(env),
    mailJobKey: readMailKey(env.MAIL_JOB_KEY),
    providers: {
      github: credentials(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET),
      google: credentials(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET),
    },
    breachCheck: readBreachCheck(env),
    contentBundlePath: env.CONTENT_BUNDLE_PATH || BUILT_BUNDLE,
    runner: readRunner(env),
  };
}

// Only on loopback, since the token and the code travel in plain HTTP
function readRunner(env: Record<string, string | undefined>) {
  const url = env.RUNNER_URL;
  const token = env.RUNNER_TOKEN;
  if (!url || !token) return undefined;
  const { hostname, protocol } = new URL(url);
  if (protocol !== "http:" || !["localhost", "127.0.0.1"].includes(hostname)) {
    throw new Error("RUNNER_URL must be http://localhost with a port.");
  }
  if (token.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `RUNNER_TOKEN needs at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }
  return { url: url.replace(/\/$/, ""), token };
}
