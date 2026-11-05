export interface ApiConfig {
  port: number;
  host: string;
  databaseUrl: string;
  logLevel: string;
}

export function readConfig(env: Record<string, string | undefined>): ApiConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env first.",
    );
  }
  return {
    port: Number(env.API_PORT ?? env.PORT ?? 4000),
    // Containers set API_HOST=0.0.0.0. Locally, stay off the network.
    host: env.API_HOST ?? "127.0.0.1",
    databaseUrl,
    logLevel: env.LOG_LEVEL ?? "info",
  };
}
