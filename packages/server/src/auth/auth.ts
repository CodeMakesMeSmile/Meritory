import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import type { Database } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import type { Mail, Mailer } from "../mail/mailer.ts";

const LINK_LIFETIME_SECONDS = 60 * 60;

export interface AuthLogger {
  error(details: object, message: string): void;
}

export interface AuthConfig {
  db: Database["db"];
  secret: string;
  /** Public URL of the auth routes, as browsers and the phone see it */
  baseUrl: string;
  webOrigin: string;
  appScheme: string;
  ipAddressHeaders?: string[];
  trustedProxies?: string[];
  mailer: Mailer;
  log: AuthLogger;
}

export function createAuth(config: AuthConfig) {
  // Not awaited, so the response takes as long whether or not the account exists
  function sendLater(mail: Mail, userId: string) {
    config.mailer
      .send(mail)
      .catch((err: unknown) =>
        config.log.error({ err, userId }, "sign-in email failed"),
      );
  }

  return betterAuth({
    appName: "Meritory",
    baseURL: config.baseUrl,
    secret: config.secret,
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    trustedOrigins: [config.webOrigin, config.appScheme],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 16,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: LINK_LIFETIME_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        sendLater(
          {
            to: user.email,
            subject: "Reset your Meritory password",
            text: [
              "Someone asked to reset the password for your Meritory account.",
              url,
              "The link works for 1 hour. Saving a new password signs out your other devices. If this wasn't you, you can ignore this email.",
            ].join("\n\n"),
          },
          user.id,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: LINK_LIFETIME_SECONDS,
      sendVerificationEmail: async ({ user, url }) => {
        sendLater(
          {
            to: user.email,
            subject: "Confirm your email for Meritory",
            text: [
              "Confirm your email to finish signing up for Meritory.",
              url,
              "The link works for 1 hour. If you didn't sign up, you can ignore this email.",
            ].join("\n\n"),
          },
          user.id,
        );
      },
    },
    rateLimit: {
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 10, max: 3 },
      },
    },
    advanced: {
      database: { generateId: "uuid" },
      ipAddress: {
        ipAddressHeaders: config.ipAddressHeaders,
        trustedProxies: config.trustedProxies,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
