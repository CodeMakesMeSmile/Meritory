import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { accounts, unlinkedProviders, users } from "../db/schema.ts";
import type { Mailer } from "../mail/mailer.ts";
import type { AuthLogger } from "./auth.ts";
import {
  isProvider,
  PROVIDER_LABELS,
  PROVIDERS,
  type Provider,
  type ProviderConfig,
} from "./providers.ts";

export type UnlinkResult = "unlinked" | "not_linked" | "last_method";

export interface SignInMethodsConfig {
  db: Database["db"];
  mailer: Mailer;
  webOrigin: string;
  providers?: ProviderConfig;
  log: AuthLogger;
}

const hasPassword = (row: { providerId: string; password: string | null }) =>
  row.providerId === "credential" && row.password !== null;

export function createSignInMethods(config: SignInMethodsConfig) {
  const { db } = config;

  async function sendUnlinked(userId: string, provider: Provider) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) return;
    const label = PROVIDER_LABELS[provider];
    await config.mailer.send(
      {
        to: user.email,
        subject: `${label} was removed from your Meritory account`,
        text: [
          `${label} can no longer sign you in to Meritory.`,
          "If this was you, there's nothing else to do.",
          `If it wasn't you, reset your password now: ${config.webOrigin}/forgot-password`,
        ].join("\n\n"),
      },
      { kind: "provider-unlinked", userId },
    );
  }

  return {
    async list(userId: string) {
      const rows = await db
        .select({
          providerId: accounts.providerId,
          password: accounts.password,
          createdAt: accounts.createdAt,
          updatedAt: accounts.updatedAt,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId));
      return {
        passwordSetAt: rows.find(hasPassword)?.updatedAt.toISOString() ?? null,
        providers: PROVIDERS.flatMap((id) => {
          const row = rows.find(({ providerId }) => providerId === id);
          return row ? [{ id, linkedAt: row.createdAt.toISOString() }] : [];
        }),
        available: PROVIDERS.filter((id) => config.providers?.[id]),
      };
    },

    /** Removes a provider, unless the account would have no way left to sign in */
    async unlink(userId: string, provider: Provider): Promise<UnlinkResult> {
      const result = await db.transaction(async (tx): Promise<UnlinkResult> => {
        // Two unlinks at once take turns, so the second sees what the first left
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`sign-in-methods:${userId}`}))`,
        );
        const rows = await tx
          .select({
            providerId: accounts.providerId,
            password: accounts.password,
          })
          .from(accounts)
          .where(eq(accounts.userId, userId));
        if (!rows.some(({ providerId }) => providerId === provider)) {
          return "not_linked";
        }
        const linked = new Set(
          rows.map(({ providerId }) => providerId).filter(isProvider),
        );
        if (linked.size + (rows.some(hasPassword) ? 1 : 0) < 2) {
          return "last_method";
        }
        await tx
          .delete(accounts)
          .where(
            and(eq(accounts.userId, userId), eq(accounts.providerId, provider)),
          );
        await tx
          .insert(unlinkedProviders)
          .values({ userId, providerId: provider })
          .onConflictDoNothing();
        return "unlinked";
      });
      if (result === "unlinked") {
        // Not awaited, so a slow queue can't hold up the page
        sendUnlinked(userId, provider).catch((err: unknown) =>
          config.log.error(
            { err, kind: "provider-unlinked", userId },
            "sign-in email failed",
          ),
        );
      }
      return result;
    },
  };
}

export type SignInMethodStore = ReturnType<typeof createSignInMethods>;
