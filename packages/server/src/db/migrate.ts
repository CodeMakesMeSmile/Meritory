import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { PgBoss } from "pg-boss";
import postgres from "postgres";
import { setUpMailQueues } from "../mail/mail-queue.ts";

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
  const sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder });
  await sql.end();
  console.log("Migrations applied.");
} else {
  console.log("No migrations yet. Nothing to apply.");
}

// The API and worker never change the queue schema, so it happens here, once per deploy
const boss = new PgBoss({
  connectionString: url,
  application_name: "meritory-migrate",
  max: 1,
  schedule: false,
  supervise: false,
});
boss.on("error", (err) => console.error(err));
await boss.start();
await setUpMailQueues(boss);
await boss.stop({ graceful: false });
console.log("Queues ready.");
