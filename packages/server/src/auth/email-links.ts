import { createHash } from "node:crypto";
import { and, eq, gt, like } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { verifications } from "../db/schema.ts";

/**
 * Better Auth's verification links stay valid for their whole lifetime. This
 * keeps one live link per person, so each link works once and a new link
 * cancels the old one.
 */
export interface EmailLinks {
  remember(userId: string, token: string, expiresAt: Date): Promise<void>;
  /** True the first time a live link is used, false after that */
  consume(token: string): Promise<boolean>;
}

const PREFIX = "email-link:";

// Only a hash is stored, so a database leak can't verify anyone
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function createEmailLinks(db: Database["db"]): EmailLinks {
  return {
    async remember(userId, token, expiresAt) {
      const identifier = `${PREFIX}${userId}`;
      await db.transaction(async (tx) => {
        await tx
          .delete(verifications)
          .where(eq(verifications.identifier, identifier));
        await tx
          .insert(verifications)
          .values({ identifier, value: hash(token), expiresAt });
      });
    },

    async consume(token) {
      // One delete, so two clicks at once can't both get through
      const used = await db
        .delete(verifications)
        .where(
          and(
            like(verifications.identifier, `${PREFIX}%`),
            eq(verifications.value, hash(token)),
            gt(verifications.expiresAt, new Date()),
          ),
        )
        .returning({ id: verifications.id });
      return used.length > 0;
    },
  };
}
