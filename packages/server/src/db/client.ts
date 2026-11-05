import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

/** A readiness probe must answer before the orchestrator's own timeout */
const PING_TIMEOUT_MS = 2000;

export function createDatabase(url: string) {
  const sql = postgres(url, { max: 10, connect_timeout: 5 });
  const db = drizzle(sql, { schema });
  return {
    db,
    /** Cheap round trip for readiness checks. False if it fails or is slow. */
    async ping(): Promise<boolean> {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), PING_TIMEOUT_MS);
      });
      const query = sql`select 1`.then(
        () => true,
        () => false,
      );
      try {
        return await Promise.race([query, timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
    close: () => sql.end({ timeout: 5 }),
  };
}

export type Database = ReturnType<typeof createDatabase>;
