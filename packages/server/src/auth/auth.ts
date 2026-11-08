import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
  checkPassword,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@meritory/password";
import { betterAuth } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api";
import { eq } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import type { Mail, Mailer, MailKind } from "../mail/mailer.ts";
import { createEmailLinks, type EmailLinks } from "./email-links.ts";
import {
  createResetLinks,
  hashResetIdentifier,
  RESET_PREFIX,
  type ResetLinks,
} from "./reset-links.ts";

const LINK_LIFETIME_SECONDS = 60 * 60;

/** Where every verification link lands, with ?error= when it fails */
export const EMAIL_CONFIRMED_PATH = "/email-confirmed";
const LINK_FAILED_PATH = `${EMAIL_CONFIRMED_PATH}?error=INVALID_TOKEN`;

/** Where reset links land, with ?token= or ?error= */
export const RESET_PASSWORD_PATH = "/reset-password";

/** Change password tries per IP in the window */
export const CHANGE_PASSWORD_LIMIT = { window: 15 * 60, max: 5 };

const PASSWORD_ERROR_CODES = {
  too_short: "PASSWORD_TOO_SHORT",
  too_long: "PASSWORD_TOO_LONG",
  personal: "PASSWORD_PERSONAL",
  weak: "PASSWORD_TOO_WEAK",
} as const;

// Runs before Better Auth's own checks, which count UTF-16 units instead of characters
function checkPasswordRules(
  password: unknown,
  about: { name?: unknown; email?: unknown },
) {
  if (typeof password !== "string") return;
  const result = checkPassword(password, {
    name: typeof about.name === "string" ? about.name : undefined,
    email: typeof about.email === "string" ? about.email : undefined,
  });
  if (result.problem) {
    throw new APIError("BAD_REQUEST", {
      code: PASSWORD_ERROR_CODES[result.problem],
      message: result.message,
    });
  }
}

// Postgres can't store a null byte, and line breaks could forge email headers
function checkName(body: Record<string, unknown>) {
  const { name } = body;
  if (typeof name === "string" && /\p{Cc}/u.test(name)) {
    throw new APIError("BAD_REQUEST", {
      code: "NAME_INVALID",
      message: "Use letters, numbers, spaces, and punctuation.",
    });
  }
}

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
  /** Defaults to the verifications table */
  emailLinks?: EmailLinks;
  /** Defaults to the verifications table */
  resetLinks?: ResetLinks;
  /** On unless turned off, in every environment */
  rateLimit?: boolean;
}

export function createAuth(config: AuthConfig) {
  const links = config.emailLinks ?? createEmailLinks(config.db);
  const resetLinks = config.resetLinks ?? createResetLinks(config.db);

  const rules = createAuthMiddleware(async (ctx) => {
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    if (ctx.path === "/sign-up/email") {
      checkName(body);
      checkPasswordRules(body.password, body);
    }

    // Better Auth only checks length here, and leaves other sessions running unless asked
    if (ctx.path === "/change-password") {
      const session = await getSessionFromCtx(ctx);
      // Without a session, Better Auth answers 401 itself
      if (session) checkPasswordRules(body.newPassword, session.user);
      return {
        context: { ...ctx, body: { ...body, revokeOtherSessions: true } },
      };
    }

    // Better Auth only checks length here, so the sign-up rules run too
    if (ctx.path === "/reset-password" && typeof body.token === "string") {
      const link = await ctx.context.internalAdapter.findVerificationValue(
        `${RESET_PREFIX}${body.token}`,
      );
      // A missing link gets Better Auth's own INVALID_TOKEN answer
      const user =
        link && link.expiresAt > new Date()
          ? await ctx.context.internalAdapter.findUserById(link.value)
          : null;
      if (user) checkPasswordRules(body.newPassword, user);
    }

    if (ctx.path === "/request-password-reset") {
      return {
        context: {
          ...ctx,
          body: { ...body, redirectTo: RESET_PASSWORD_PATH },
        },
      };
    }

    // Links always land on our page, whatever the client asked for
    if (
      ctx.path === "/sign-up/email" ||
      ctx.path === "/send-verification-email"
    ) {
      return {
        context: {
          ...ctx,
          body: { ...body, callbackURL: EMAIL_CONFIRMED_PATH },
        },
      };
    }

    if (ctx.path === "/verify-email") {
      const token = ctx.query?.token;
      if (typeof token !== "string" || !(await links.consume(token))) {
        throw ctx.redirect(LINK_FAILED_PATH);
      }
    }
  });

  // Not awaited, so the response takes as long whether or not the account exists
  function sendLater(mail: Mail, kind: MailKind, userId: string) {
    config.mailer
      .send(mail, { kind, userId })
      .catch((err: unknown) =>
        config.log.error({ err, kind, userId }, "sign-in email failed"),
      );
  }

  function sendPasswordChanged(user: { id: string; email: string }) {
    sendLater(
      {
        to: user.email,
        subject: "Your Meritory password was changed",
        text: [
          "The password for your Meritory account was just changed, and your other devices were signed out.",
          "If this was you, there's nothing else to do.",
          `If it wasn't you, reset your password now: ${config.webOrigin}/forgot-password`,
        ].join("\n\n"),
      },
      "password-changed",
      user.id,
    );
  }

  const afterRoutes = createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/change-password") return;
    const returned = ctx.context.returned as { user?: unknown } | undefined;
    if (!returned || isAPIError(returned)) return;
    const user = returned.user as { id: string; email: string } | undefined;
    if (user) sendPasswordChanged(user);
  });

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
          "existing-account",
          user.id,
        );
      },
      resetPasswordTokenExpiresIn: LINK_LIFETIME_SECONDS,
      revokeSessionsOnPasswordReset: true,
      // Not awaited, so a real account answers as fast as an unknown email
      sendResetPassword: async ({ user, url, token }) => {
        resetLinks
          .claim(user.id, token)
          .then((fresh) => {
            if (!fresh) return;
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
              "reset-password",
              user.id,
            );
          })
          .catch((err: unknown) =>
            config.log.error({ err, userId: user.id }, "reset link failed"),
          );
      },
      onPasswordReset: async ({ user }) => {
        await resetLinks.revokeAll(user.id);
        // Opening the link proved they read this inbox
        if (!user.emailVerified) {
          await config.db
            .update(schema.users)
            .set({ emailVerified: true })
            .where(eq(schema.users.id, user.id));
        }
        sendPasswordChanged(user);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: LINK_LIFETIME_SECONDS,
      sendVerificationEmail: async ({ user, url, token }) => {
        await links.remember(
          user.id,
          token,
          new Date(Date.now() + LINK_LIFETIME_SECONDS * 1000),
        );
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
          "verify-email",
          user.id,
        );
      },
    },
    rateLimit: {
      // Better Auth only limits in production by default. This keeps local the same.
      enabled: config.rateLimit ?? true,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 10, max: 3 },
        "/change-password": CHANGE_PASSWORD_LIMIT,
      },
    },
    hooks: { before: rules, after: afterRoutes },
    session: {
      additionalFields: {
        confirmedAt: { type: "date", required: false, input: false },
      },
    },
    verification: {
      storeIdentifier: {
        default: "plain",
        overrides: { [RESET_PREFIX]: { hash: hashResetIdentifier } },
      },
    },
    advanced: {
      // Better Auth skips the cross-site check under tests by default. This keeps it on, so tests prove it.
      disableOriginCheck: false,
      database: { generateId: "uuid" },
      ipAddress: {
        ipAddressHeaders: config.ipAddressHeaders,
        trustedProxies: config.trustedProxies,
      },
    },
  });

  sendFreshLink = (email) => {
    auth.api
      .sendVerificationEmail({
        body: { email, callbackURL: EMAIL_CONFIRMED_PATH },
      })
      .catch((err: unknown) =>
        config.log.error({ err }, "verification email failed"),
      );
  };

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
