import { API_PREFIX } from "@meritory/contracts";
import { createAuth, createDatabase, createSmtpMailer } from "@meritory/server";
import { buildApp } from "./app.ts";
import { readConfig } from "./config.ts";

const config = readConfig(process.env);
const database = createDatabase(config.databaseUrl);
const auth = createAuth({
  db: database.db,
  secret: config.authSecret,
  baseUrl: `${config.publicApiUrl}${API_PREFIX}/auth`,
  webOrigin: config.webOrigin,
  appScheme: config.appScheme,
  ipAddressHeaders: config.ipAddressHeaders,
  trustedProxies: config.trustedProxies,
  mailer: createSmtpMailer(config.smtp),
  log: { error: (details, message) => app.log.error(details, message) },
});
const app = await buildApp(
  {
    pingDatabase: database.ping,
    handleAuth: auth.handler,
    publicApiUrl: config.publicApiUrl,
    async currentUser(headers) {
      const session = await auth.api.getSession({ headers });
      if (!session) return null;
      const { id, name, email } = session.user;
      return { id, name, email };
    },
  },
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
