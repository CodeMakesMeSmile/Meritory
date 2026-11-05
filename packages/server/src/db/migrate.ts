import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

if (!existsSync(`${migrationsFolder}/meta/_journal.json`)) {
  console.log("No migrations yet. Nothing to apply.");
  process.exit(0);
}

const sql = postgres(url, { max: 1 });
await migrate(drizzle(sql), { migrationsFolder });
await sql.end();
console.log("Migrations applied.");
