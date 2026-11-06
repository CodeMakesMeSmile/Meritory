import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      // biome-ignore lint/security/noSecrets: the local Docker database from docker-compose.yml
      "postgres://meritory:meritory@localhost:5432/meritory",
  },
  strict: true,
});
