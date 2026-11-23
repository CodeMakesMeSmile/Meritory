import {
  createBoss,
  createDatabase,
  createSmtpMailer,
  PURGE_INTERVAL_MS,
  purgeExpired,
  readMailKey,
  readSmtpConfig,
  startMailWorker,
} from "@meritory/server";
import pino from "pino";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  log.fatal("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const key = readMailKey(process.env.MAIL_JOB_KEY);
const boss = createBoss({
  url: databaseUrl,
  worker: true,
  onError: (err) => log.error({ err }, "queue error"),
});
boss.on("warning", ({ message }) => log.warn({ message }, "queue warning"));
const database = createDatabase(databaseUrl);

// Counts only, since the rows hold hashed emails and user ids
const purge = () =>
  purgeExpired(database.db)
    .then((removed) => log.info(removed, "expired sign-in rows removed"))
    .catch((err: unknown) => log.error({ err }, "purge failed"));

async function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), 55_000).unref();
  // Longer than SEND_DEADLINE_MS, so a send in progress ends before the worker does
  await boss.stop({ graceful: true, timeout: 50_000 });
  await database.close();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

// Fails fast if the migrate step hasn't set up the queue
await boss.start();
await startMailWorker({
  boss,
  key,
  mailer: createSmtpMailer(readSmtpConfig(process.env)),
  log,
});
void purge();
setInterval(() => void purge(), PURGE_INTERVAL_MS).unref();
log.info("worker started");
