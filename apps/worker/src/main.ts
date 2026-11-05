import { createProvider, readAiConfig } from "@meritory/ai";
import { createDatabase } from "@meritory/server";
import pino from "pino";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  log.fatal("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const database = createDatabase(databaseUrl);
const ai = createProvider(readAiConfig(process.env));
const pollMs = Number(process.env.WORKER_POLL_MS ?? 5000);

let stopping = false;
let timer: NodeJS.Timeout | undefined;

// TODO: claim jobs once the queue exists. For now each tick pings the database.
async function tick() {
  if (stopping) return;
  const ok = await database.ping();
  if (!ok) log.warn("database unreachable");
  timer = setTimeout(tick, pollMs);
}

async function shutdown(signal: string) {
  stopping = true;
  clearTimeout(timer);
  log.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), 10_000).unref();
  await database.close();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

log.info(
  { ai: { provider: ai.name, model: ai.model }, pollMs },
  "worker started",
);
await tick();
