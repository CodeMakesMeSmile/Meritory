import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import type { Database } from "./db/client.ts";
import { users } from "./db/schema.ts";

/** Real account rows for tests in other packages, removed together at the end */
export function testUsers(db: Database["db"]) {
  const made: string[] = [];
  return {
    async create(): Promise<string> {
      const id = randomUUID();
      await db
        .insert(users)
        .values({ id, name: "Test", email: `test-${id}@meritory.test` });
      made.push(id);
      return id;
    },
    async removeAll(): Promise<void> {
      if (made.length > 0)
        await db.delete(users).where(inArray(users.id, made));
    },
  };
}
