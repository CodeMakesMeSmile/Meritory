import { createProvider, readAiConfig } from "@meritory/ai";
import {
  createBoss,
  createSmtpMailer,
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
const ai = createProvider(readAiConfig(process.env));
const boss = createBoss({
  url: databaseUrl,
  worker: true,
  onError: (err) => log.error({ err }, "queue error"),
});
boss.on("warning", ({ message }) => log.warn({ message }, "queue warning"));

async function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), 10_000).unref();
  // Lets a send in progress finish, so it isn't tried twice
  await boss.stop({ graceful: true, timeout: 8_000 });
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
log.info({ ai: { provider: ai.name, model: ai.model } }, "worker started");
