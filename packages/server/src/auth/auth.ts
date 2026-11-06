import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
  checkPassword,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@meritory/password";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import type { Database } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import type { Mail, Mailer } from "../mail/mailer.ts";

const LINK_LIFETIME_SECONDS = 60 * 60;

const PASSWORD_ERROR_CODES = {
  too_short: "PASSWORD_TOO_SHORT",
  too_long: "PASSWORD_TOO_LONG",
  personal: "PASSWORD_PERSONAL",
  weak: "PASSWORD_TOO_WEAK",
} as const;

// Runs before Better Auth's own checks, which count UTF-16 units instead of characters
const passwordRules = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-up/email") return;
  const { password, name, email } = (ctx.body ?? {}) as Record<string, unknown>;
  if (typeof password !== "string") return;
  const result = checkPassword(password, {
    name: typeof name === "string" ? name : undefined,
    email: typeof email === "string" ? email : undefined,
  });
  if (result.problem) {
    throw new APIError("BAD_REQUEST", {
      code: PASSWORD_ERROR_CODES[result.problem],
      message: result.message,
    });
  }
});

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

  // Set once auth exists, so the duplicate sign-up hook can use its API
  let sendFreshLink: (email: string) => void = () => {};

  const auth = betterAuth({
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
      minPasswordLength: MIN_PASSWORD_LENGTH,
      // Our rule counts characters. An emoji takes two UTF-16 units here.
      maxPasswordLength: MAX_PASSWORD_LENGTH * 2,
      requireEmailVerification: true,
      autoSignIn: false,
      // Better Auth answers as if the account were new. This tells the real owner.
      onExistingUserSignUp: async ({ user }) => {
        if (!user.emailVerified) {
          sendFreshLink(user.email);
          return;
        }
        sendLater(
          {
            to: user.email,
            subject: "Someone tried to sign up with your email",
            text: [
              "Someone tried to create a Meritory account with this email, but you already have one.",
              `Sign in: ${config.webOrigin}/sign-in`,
              `Forgot your password? ${config.webOrigin}/forgot-password`,
              "If this wasn't you, you can ignore this email. Nothing about your account has changed.",
            ].join("\n\n"),
          },
          user.id,
        );
      },
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
    hooks: { before: passwordRules },
    advanced: {
      database: { generateId: "uuid" },
      ipAddress: {
        ipAddressHeaders: config.ipAddressHeaders,
        trustedProxies: config.trustedProxies,
      },
    },
  });

  sendFreshLink = (email) => {
    auth.api
      .sendVerificationEmail({ body: { email } })
      .catch((err: unknown) =>
        config.log.error({ err }, "verification email failed"),
      );
  };

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
