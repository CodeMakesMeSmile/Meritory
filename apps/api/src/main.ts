import { createDatabase } from "@meritory/server";
import { buildApp } from "./app.ts";
import { readConfig } from "./config.ts";

const config = readConfig(process.env);
const database = createDatabase(config.databaseUrl);
const app = await buildApp(
  { pingDatabase: database.ping },
  { logger: { level: config.logLevel } },
);

// Close HTTP before the database so in-flight requests finish. Force exit after 10s.
async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.close();
  await database.close();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

await app.listen({ port: config.port, host: config.host });
