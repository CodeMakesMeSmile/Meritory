import type { SmtpConfig } from "@meritory/server";

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
  ipAddressHeaders?: string[];
  trustedProxies?: string[];
  smtp: SmtpConfig;
}

const MIN_SECRET_LENGTH = 32;

function list(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    appScheme: "meritory://",
    ipAddressHeaders: list(env.AUTH_IP_HEADERS),
    trustedProxies: list(env.AUTH_TRUSTED_PROXIES),
    smtp: {
      host: env.SMTP_HOST ?? "localhost",
      port: Number(env.SMTP_PORT ?? 1025),
      from: env.MAIL_FROM ?? "Meritory <no-reply@meritory.localhost>",
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    },
  };
}
