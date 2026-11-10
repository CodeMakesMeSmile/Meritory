import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import {
  checkPassword,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@meritory/password";
import { betterAuth } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getOAuthState,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, count, eq } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import type { Mail, Mailer, MailKind } from "../mail/mailer.ts";
import { isFresh } from "./account-sessions.ts";
import { type AppCodes, createAppCodes, isChallenge } from "./app-codes.ts";
import { createEmailLinks, type EmailLinks } from "./email-links.ts";
import {
  appReturnAddress,
  isProvider,
  PROVIDER_LABELS,
  PROVIDER_UNLINKED,
  type Provider,
  type ProviderConfig,
  providerRedirects,
  socialProviders,
  withLinked,
  withoutTokens,
} from "./providers.ts";
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

/** Code trades per IP in the window. The app makes one per sign-in. */
export const APP_SESSION_LIMIT = { window: 60, max: 10 };

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
  /** Only set outside production, so a release never trusts Expo Go */
  expoGoScheme?: string;
  ipAddressHeaders?: string[];
  trustedProxies?: string[];
  mailer: Mailer;
  log: AuthLogger;
  /** GitHub and Google, each only when its credentials are set */
  providers?: ProviderConfig;
  /** Defaults to the verifications table */
  emailLinks?: EmailLinks;
  /** Defaults to the verifications table */
  resetLinks?: ResetLinks;
  /** Defaults to the verifications table */
  appCodes?: AppCodes;
  /** On unless turned off, in every environment */
  rateLimit?: boolean;
}

const APP_CODE_INVALID = {
  code: "APP_CODE_INVALID",
  message: "Sign-in didn't finish. Try again.",
};

/** The Expo plugin, minus its after hook that copies the session cookie into the app's link */
function expoWithoutSessionInLink() {
  const plugin = expo();
  const after = plugin.hooks.after.filter(
    (hook) => !hook.matcher({ path: "/callback/github" } as never),
  );
  return { ...plugin, hooks: { ...plugin.hooks, after } };
}

export function createAuth(config: AuthConfig) {
  const links = config.emailLinks ?? createEmailLinks(config.db);
  const resetLinks = config.resetLinks ?? createResetLinks(config.db);
  const appCodes = config.appCodes ?? createAppCodes(config.db);

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

    if (ctx.path === "/link-social") {
      // A token sent straight here would skip the trip through the provider
      if (body.idToken !== undefined) {
        throw new APIError("BAD_REQUEST", {
          code: "LINK_NEEDS_PROVIDER",
          message: "Link this from Account.",
        });
      }
      const session = await getSessionFromCtx(ctx);
      if (session && !isFresh(session.session)) {
        throw new APIError("FORBIDDEN", {
          code: "confirm_password",
          message: "Enter your password to keep going.",
        });
      }
      if (isProvider(body.provider)) {
        return {
          context: {
            ...ctx,
            body: {
              ...body,
              ...providerRedirects(body.provider, {
                callbackURL: "/account",
                errorCallbackURL: "/account",
              }),
            },
          },
        };
      }
    }

    // Providers send people back only to our own paths
    if (ctx.path === "/sign-in/social" && isProvider(body.provider)) {
      const appAddress = appReturnAddress(
        ctx.headers?.get("origin"),
        config.appScheme,
        config.expoGoScheme,
      );
      const challenge = (body.additionalData as Record<string, unknown>)
        ?.appCodeChallenge;
      // The app's link only carries a code, which is useless without the verifier
      if (appAddress && !isChallenge(challenge)) {
        throw new APIError("BAD_REQUEST", {
          code: "APP_CHALLENGE_REQUIRED",
          message: "Update the app and try again.",
        });
      }
      return {
        context: {
          ...ctx,
          body: {
            ...body,
            ...providerRedirects(body.provider, body, appAddress),
            // Replaces any value the request sent, since an empty string still overrides
            ...(appAddress && {
              additionalData: {
                appUserAgent: ctx.headers?.get("user-agent") ?? "",
                appCodeChallenge: challenge,
              },
            }),
          },
        },
      };
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

  // A new sign-in method on an account that already had one, so true when it was linked
  async function sendProviderLinked(providerId: string, userId: string) {
    if (!isProvider(providerId)) return false;
    const [{ total } = { total: 0 }] = await config.db
      .select({ total: count() })
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, userId));
    if (total < 2) return false;
    const [user] = await config.db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    if (!user) return false;
    const label = PROVIDER_LABELS[providerId];
    sendLater(
      {
        to: user.email,
        subject: `${label} was added to your Meritory account`,
        text: [
          `${label} can now sign you in to Meritory.`,
          "If this was you, there's nothing else to do.",
          `If it wasn't you, reset your password now: ${config.webOrigin}/forgot-password`,
        ].join("\n\n"),
      },
      "provider-linked",
      userId,
    );
    return true;
  }

  async function wasUnlinked(userId: string, providerId: string) {
    const rows = await config.db
      .select({ userId: schema.unlinkedProviders.userId })
      .from(schema.unlinkedProviders)
      .where(
        and(
          eq(schema.unlinkedProviders.userId, userId),
          eq(schema.unlinkedProviders.providerId, providerId),
        ),
      );
    return rows.length > 0;
  }

  // Requests where a provider was just added to an existing account, keyed by request
  const justLinked = new WeakMap<object, Provider>();
  // Challenges from sign-ins the app started, keyed by request
  const appChallenges = new WeakMap<object, string>();

  const afterRoutes = createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/callback/:id") {
      const provider = justLinked.get(ctx.context);
      const returned = ctx.context.returned;
      let location = isAPIError(returned)
        ? returned.headers?.get("location")
        : null;
      if (!location) return;
      const signedIn = ctx.context.newSession;
      const appAddress = appReturnAddress(
        location,
        config.appScheme,
        config.expoGoScheme,
      );
      if (appAddress && signedIn) {
        // The session goes to the app through the code, never through the browser tab
        const { authCookies } = ctx.context;
        const sessionCookies = [
          authCookies.sessionToken.name,
          authCookies.sessionData.name,
          authCookies.dontRememberToken.name,
        ];
        const headers = ctx.context.responseHeaders;
        const kept = (headers?.getSetCookie() ?? []).filter(
          (cookie) => !sessionCookies.includes(cookie.split("=")[0] ?? ""),
        );
        headers?.delete("set-cookie");
        for (const cookie of kept) headers?.append("set-cookie", cookie);

        const challenge = appChallenges.get(ctx.context);
        if (!challenge) {
          await ctx.context.internalAdapter.deleteSession(
            signedIn.session.token,
          );
          throw ctx.redirect(
            `${appAddress}sign-in?provider=${ctx.params?.id}&error=failed`,
          );
        }
        const code = await appCodes.issue(signedIn.session.token, challenge);
        location = `${appAddress}?code=${code}`;
      } else if (!provider) {
        return;
      }
      throw ctx.redirect(provider ? withLinked(location, provider) : location);
    }
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
    trustedOrigins: [
      config.webOrigin,
      config.appScheme,
      ...(config.expoGoScheme ? [config.expoGoScheme] : []),
    ],
    plugins: [
      expoWithoutSessionInLink(),
      {
        id: "app-session",
        endpoints: {
          // The app trades the code from its link, plus its verifier, for the session
          appSession: createAuthEndpoint(
            "/app-session",
            { method: "POST" },
            async (ctx) => {
              const { code, verifier } = (ctx.body ?? {}) as Record<
                string,
                unknown
              >;
              const token =
                typeof code === "string" && typeof verifier === "string"
                  ? await appCodes.redeem(code, verifier)
                  : null;
              const found = token
                ? await ctx.context.internalAdapter.findSession(token)
                : null;
              if (!found) throw new APIError("UNAUTHORIZED", APP_CODE_INVALID);
              await setSessionCookie(ctx, found);
              return ctx.json({ ok: true });
            },
          ),
        },
      },
    ],
    socialProviders: socialProviders(config.providers),
    // Our own route takes a lock and remembers the unlink
    disabledPaths: ["/unlink-account"],
    user: {
      validateUserInfo: async ({ user, source }) => {
        if (source.method !== "oauth") return;
        // GitHub's own lookup refuses unverified emails. This covers Google too.
        if (!user.emailVerified) return { error: "email_not_verified" };
        // Only a link started from Account carries link state
        if (
          source.action === "link-account" &&
          source.oauth &&
          user.id &&
          !(await getOAuthState())?.link &&
          (await wasUnlinked(user.id, source.oauth.providerId))
        ) {
          return { error: PROVIDER_UNLINKED };
        }
      },
    },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => ({ data: withoutTokens(account) }),
          after: async (account, ctx) => {
            await config.db
              .delete(schema.unlinkedProviders)
              .where(
                and(
                  eq(schema.unlinkedProviders.userId, account.userId),
                  eq(schema.unlinkedProviders.providerId, account.providerId),
                ),
              );
            const linked = await sendProviderLinked(
              account.providerId,
              account.userId,
            );
            if (linked && ctx && isProvider(account.providerId)) {
              justLinked.set(ctx.context, account.providerId);
            }
          },
        },
        update: {
          before: async (account) => ({ data: withoutTokens(account) }),
        },
      },
      session: {
        create: {
          // A sign-in from the app ends in its browser tab, so keep the app's own agent
          before: async (session, ctx) => {
            if (ctx?.path !== "/callback/:id") return;
            const state = await getOAuthState<{
              appUserAgent?: unknown;
              appCodeChallenge?: unknown;
            }>();
            const agent = state?.appUserAgent;
            // A request can't set the return address, so it marks a sign-in from the app
            const fromApp = appReturnAddress(
              state?.callbackURL,
              config.appScheme,
              config.expoGoScheme,
            );
            if (!fromApp) return;
            if (isChallenge(state?.appCodeChallenge)) {
              appChallenges.set(ctx.context, state.appCodeChallenge);
            }
            if (typeof agent !== "string" || !agent) return;
            return { data: { ...session, userAgent: agent } };
          },
          // Signing in again with GitHub or Google in the same browser replaces that session
          after: async (session, ctx) => {
            if (ctx?.path !== "/callback/:id") return;
            const token = await ctx.getSignedCookie(
              ctx.context.authCookies.sessionToken.name,
              ctx.context.secret,
            );
            if (!token) return;
            const old = await ctx.context.internalAdapter.findSession(token);
            if (
              old?.session.userId === session.userId &&
              old.session.id !== session.id
            ) {
              await ctx.context.internalAdapter.deleteSession(token);
            }
          },
        },
      },
    },
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
        "/app-session": APP_SESSION_LIMIT,
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
