import { API_PREFIX } from "@meritory/contracts";
import {
  createAccountSessions,
  createAuth,
  createBoss,
  createDatabase,
  createQueuedMailer,
  isFresh,
} from "@meritory/server";
import { buildApp } from "./app.ts";
import { readConfig } from "./config.ts";

const config = readConfig(process.env);
const database = createDatabase(config.databaseUrl);
const boss = createBoss({
  url: config.databaseUrl,
  onError: (err) => app.log.error({ err }, "queue error"),
});
const auth = createAuth({
  db: database.db,
  secret: config.authSecret,
  baseUrl: `${config.publicApiUrl}${API_PREFIX}/auth`,
  webOrigin: config.webOrigin,
  appScheme: config.appScheme,
  ipAddressHeaders: config.ipAddressHeaders,
  trustedProxies: config.trustedProxies,
  // The worker sends them, with retries
  mailer: createQueuedMailer(boss, config.mailJobKey),
  log: { error: (details, message) => app.log.error(details, message) },
});
const app = await buildApp(
  {
    pingDatabase: database.ping,
    handleAuth: auth.handler,
    publicApiUrl: config.publicApiUrl,
    webOrigin: config.webOrigin,
    accountSessions: createAccountSessions(database.db, auth),
    async currentSession(headers) {
      const found = await auth.api.getSession({ headers });
      if (!found) return null;
      const { id, name, email } = found.user;
      return {
        user: { id, name, email },
        sessionId: found.session.id,
        fresh: isFresh(found.session),
      };
    },
  },
  { logger: { level: config.logLevel } },
);

// Close HTTP before the database so in-flight requests finish. Force exit after 10s.
async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.close();
  await boss.stop({ graceful: false });
  await database.close();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

// Fails fast if the migrate step hasn't set up the queue
await boss.start();
await app.listen({ port: config.port, host: config.host });
