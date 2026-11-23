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
import { and, count, eq, ne } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import {
  approveEmailChange,
  confirmNewEmail,
  emailChanged,
  emailInUse,
  existingAccount,
  finishSignUp,
  passwordChanged,
  providerLinked,
  resetPassword,
  verifyEmail,
} from "../mail/emails.ts";
import type { Mail, Mailer, MailKind } from "../mail/mailer.ts";
import {
  createAccountNotices,
  createSignInFailures,
} from "./account-limits.ts";
import { isFresh } from "./account-sessions.ts";
import { type AppCodes, createAppCodes, isChallenge } from "./app-codes.ts";
import type { BreachCheck } from "./breached-passwords.ts";
import {
  type ChangeLink,
  EMAIL_CHANGE_PATH,
  emailChangePath,
  readChangeLink,
} from "./email-change.ts";
import { createEmailLinks, type EmailLinks } from "./email-links.ts";
import {
  appReturnAddress,
  isProvider,
  MAX_NAME_LENGTH,
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
/** The same page, asking for a first password instead of a new one */
export const FINISH_SIGN_UP_PATH = `${RESET_PASSWORD_PATH}?finish=1`;

/** Change password tries per IP in the window */
export const CHANGE_PASSWORD_LIMIT = { window: 15 * 60, max: 5 };

/** Email change requests per IP in the window */
export const CHANGE_EMAIL_LIMIT = { window: 15 * 60, max: 5 };

// Asks the page to show Confirm it's you, then try again
const CONFIRM_FIRST = {
  code: "confirm_password",
  message: "Enter your password to keep going.",
};

/** Code trades per IP in the window. The app makes one per sign-in. */
export const APP_SESSION_LIMIT = { window: 60, max: 10 };

/** Email change approvals per IP in the window */
export const APPROVE_EMAIL_CHANGE_LIMIT = { window: 60, max: 10 };

/** Where the approval email's button opens, with ?token= */
export const APPROVE_EMAIL_CHANGE_PATH = "/approve-email-change";

/** Email confirmations per IP in the window */
export const CONFIRM_EMAIL_LIMIT = { window: 60, max: 10 };

/** Where a confirmation email's button opens, with ?token= */
export const CONFIRM_EMAIL_PATH = "/confirm-email";

const CONFIRM_INVALID = {
  code: "INVALID_TOKEN",
  message: "This link didn't work. Ask for a new one.",
};

const APPROVAL_INVALID = {
  code: "INVALID_TOKEN",
  message: "This link didn't work. Start the change again from Account.",
};

// The same answer Better Auth's own limiter gives
const TOO_MANY = { message: "Too many requests. Please try again later." };

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

const COMPROMISED = {
  code: "PASSWORD_COMPROMISED",
  message:
    "This password has shown up in a data breach, so it's easy to guess. Choose a different one, like a few unrelated words.",
};

// The sign-up name rules, used by Account too
function checkName(name: unknown) {
  if (typeof name !== "string" || !name.trim()) {
    throw new APIError("BAD_REQUEST", {
      code: "NAME_INVALID",
      message: "Enter a name. A nickname is fine.",
    });
  }
  // Postgres can't store a null byte, and line breaks could forge email headers
  if (/\p{Cc}/u.test(name)) {
    throw new APIError("BAD_REQUEST", {
      code: "NAME_INVALID",
      message: "Use letters, numbers, spaces, and punctuation.",
    });
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    throw new APIError("BAD_REQUEST", {
      code: "NAME_INVALID",
      message: `Use ${MAX_NAME_LENGTH} characters or fewer.`,
    });
  }
}

/** A JSON body without its session tokens, or null when it has none */
function withoutSessionTokens(returned: unknown) {
  if (
    typeof returned !== "object" ||
    returned === null ||
    Array.isArray(returned) ||
    returned instanceof Response ||
    isAPIError(returned)
  ) {
    return null;
  }
  const { token, session, ...rest } = returned as Record<string, unknown>;
  const inner =
    typeof session === "object" && session !== null && "token" in session
      ? (session as Record<string, unknown>)
      : null;
  if (token === undefined && !inner) return null;
  if (!inner) return session === undefined ? rest : { ...rest, session };
  const { token: _token, ...kept } = inner;
  return { ...rest, session: kept };
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
  /** Left out, passwords aren't checked against known breaches */
  breachCheck?: BreachCheck;
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
  const notices = createAccountNotices(config.db);
  // Follows the IP limiter's switch, so tests that turn it off can repeat wrong passwords
  const signInFailures =
    config.rateLimit === false ? null : createSignInFailures(config.db);

  // Runs after the local rules, so the service is only asked about passwords that pass them
  const rejectBreached = async (password: unknown) => {
    if (typeof password !== "string" || !config.breachCheck) return;
    if (await config.breachCheck(password)) {
      throw new APIError("BAD_REQUEST", COMPROMISED);
    }
  };

  const rules = createAuthMiddleware(async (ctx) => {
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    if (
      ctx.path === "/sign-in/email" &&
      signInFailures &&
      typeof body.email === "string"
    ) {
      // Counted per email whether or not it has an account, so the answer is the same
      const wait = await signInFailures.wait(body.email);
      if (wait !== null) {
        throw new APIError("TOO_MANY_REQUESTS", TOO_MANY, {
          "X-Retry-After": String(wait),
        });
      }
    }

    if (ctx.path === "/sign-up/email") {
      checkName(body.name);
      checkPasswordRules(body.password, body);
      await rejectBreached(body.password);
    }

    if (ctx.path === "/update-user") {
      // Better Auth would also take an image and its own fields, and a hook can't drop keys
      if (Object.keys(body).some((key) => key !== "name")) {
        throw new APIError("BAD_REQUEST", {
          code: "ONLY_NAME",
          message: "Only your name can change here.",
        });
      }
      checkName(body.name);
      return {
        context: { ...ctx, body: { name: (body.name as string).trim() } },
      };
    }

    // Better Auth only checks length here, and leaves other sessions running unless asked
    if (ctx.path === "/change-password") {
      const session = await getSessionFromCtx(ctx);
      // Without a session, Better Auth answers 401 itself
      if (session) {
        checkPasswordRules(body.newPassword, session.user);
        await rejectBreached(body.newPassword);
      }
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
      if (user) {
        checkPasswordRules(body.newPassword, user);
        await rejectBreached(body.newPassword);
      }
      // A sign-up finishing has no way in yet, so no password is being changed
      if (user && ctx.request) {
        const methods = await ctx.context.internalAdapter.findAccounts(user.id);
        if (methods.length === 0) firstPasswords.add(ctx.request);
      }
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
        throw new APIError("FORBIDDEN", CONFIRM_FIRST);
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

    if (ctx.path === "/change-email") {
      const session = await getSessionFromCtx(ctx);
      // Without a session, Better Auth answers 401 itself
      if (session) {
        if (!isFresh(session.session)) {
          throw new APIError("FORBIDDEN", CONFIRM_FIRST);
        }
        const newEmail =
          typeof body.newEmail === "string" ? body.newEmail.toLowerCase() : "";
        if (newEmail === session.user.email.toLowerCase()) {
          throw new APIError("BAD_REQUEST", {
            code: "SAME_EMAIL",
            message: "That's already your email.",
          });
        }
        // Better Auth answers as if it were free, so the owner hears about it
        const owner = newEmail
          ? await ctx.context.internalAdapter.findUserByEmail(newEmail)
          : null;
        if (owner) sendEmailInUse(owner.user);
      }
      return {
        context: { ...ctx, body: { ...body, callbackURL: EMAIL_CHANGE_PATH } },
      };
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
      const change = typeof token === "string" ? readChangeLink(token) : null;
      const failed = change ? emailChangePath("failed") : LINK_FAILED_PATH;
      // Every link takes a press on our page, so only our own routes get past here
      if (typeof token !== "string" || ctx.request || !pressed.delete(token)) {
        throw ctx.redirect(failed);
      }
      // The approve route has already used its link
      if (change && !change.finishes) return;
      if (!(await links.consume(token))) throw ctx.redirect(failed);
      if (change) {
        // Someone may have taken the address since it was approved
        const taken = await ctx.context.internalAdapter.findUserByEmail(
          change.to,
        );
        if (taken) throw ctx.redirect(failed);
      }
      // No callbackURL, so Better Auth answers instead of redirecting
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
      passwordChanged(user.email, config.webOrigin),
      "password-changed",
      user.id,
    );
  }

  // Skipped inside the same background chain, so the response never changes
  function sendNotice(mail: Mail, kind: MailKind, userId: string) {
    notices
      .claim(kind, userId)
      .then((claimed) => {
        if (claimed) sendLater(mail, kind, userId);
      })
      .catch((err: unknown) =>
        config.log.error({ err, kind, userId }, "sign-in email failed"),
      );
  }

  function sendEmailInUse(user: { id: string; email: string }) {
    sendNotice(
      emailInUse(user.email, config.webOrigin),
      "email-in-use",
      user.id,
    );
  }

  // Like a new password, a new email signs out every other device
  async function finishEmailChange(
    ctx: Parameters<typeof getSessionFromCtx>[0],
    change: ChangeLink,
  ) {
    const here = await getSessionFromCtx(ctx);
    const keep = here?.user.id === change.userId ? here.session.id : undefined;
    await config.db
      .delete(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, change.userId),
          ...(keep ? [ne(schema.sessions.id, keep)] : []),
        ),
      );
    sendLater(
      emailChanged(change.from, change.to),
      "email-changed",
      change.userId,
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
      providerLinked(user.email, label, config.webOrigin),
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
    if (ctx.path === "/sign-in/email" && signInFailures) {
      const email = (ctx.body as Record<string, unknown> | undefined)?.email;
      const returned = ctx.context.returned;
      if (typeof email !== "string" || !returned) return;
      if (!isAPIError(returned)) {
        await signInFailures.clear(email);
      } else if (returned.statusCode === 401) {
        await signInFailures.record(email);
      }
      return;
    }
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

  // The session cookie is all a client needs, so tokens stay out of bodies page scripts can read
  const withoutTokensInBody = {
    id: "no-session-tokens",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            const body = withoutSessionTokens(ctx.context.returned);
            if (body) return ctx.json(body);
          }),
        },
      ],
    },
  };

  // Reset links that finish a sign-up instead of changing a password, by user
  const finishing = new Set<string>();
  // Resets that set an account's first way to sign in, by request
  const firstPasswords = new WeakSet<Request>();

  // Links whose button was pressed, which our routes are passing to Better Auth
  const pressed = new Set<string>();
  // Set once auth exists, so the approve and confirm routes can use its API
  let verifyPressed: (token: string, headers?: Headers) => Promise<boolean> =
    async () => false;

  // Set once auth exists, so the duplicate sign-up hook can use its API
  let sendFinishLink: (user: { id: string; email: string }) => void = () => {};

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
          // The page behind the approval email posts here, so opening the link changes nothing
          approveEmailChange: createAuthEndpoint(
            "/approve-email-change",
            { method: "POST" },
            async (ctx) => {
              const { token } = (ctx.body ?? {}) as Record<string, unknown>;
              const change =
                typeof token === "string" ? readChangeLink(token) : null;
              const approved =
                typeof token === "string" &&
                change !== null &&
                !change.finishes &&
                (await links.consume(token)) &&
                (await verifyPressed(token, ctx.headers));
              if (!approved) {
                throw new APIError("BAD_REQUEST", APPROVAL_INVALID);
              }
              return ctx.json({ status: "approved" });
            },
          ),
          // The page behind a confirmation email posts here, so a mail scanner opening the link confirms nothing
          confirmEmail: createAuthEndpoint(
            "/confirm-email",
            { method: "POST" },
            async (ctx) => {
              const { token } = (ctx.body ?? {}) as Record<string, unknown>;
              const change =
                typeof token === "string" ? readChangeLink(token) : null;
              const confirmed =
                typeof token === "string" &&
                (change === null || change.finishes) &&
                (await verifyPressed(token, ctx.headers));
              if (!confirmed) {
                throw new APIError("BAD_REQUEST", CONFIRM_INVALID);
              }
              if (change) await finishEmailChange(ctx, change);
              return ctx.json({ status: change ? "changed" : "confirmed" });
            },
          ),
        },
      },
      // Last, so it sees each body after every other hook
      withoutTokensInBody,
    ],
    socialProviders: socialProviders(config.providers),
    // Our own routes take a lock and remember the unlink, and list and end sessions
    disabledPaths: [
      "/unlink-account",
      "/list-sessions",
      "/revoke-session",
      "/revoke-sessions",
      "/revoke-other-sessions",
    ],
    user: {
      changeEmail: {
        enabled: true,
        // The current address approves first, then the new one confirms
        sendChangeEmailConfirmation: async ({ user, newEmail, token }) => {
          const link = `${config.webOrigin}${APPROVE_EMAIL_CHANGE_PATH}?${new URLSearchParams({ token })}`;
          // Not awaited, so a free address answers as fast as a taken one
          links
            .remember(
              user.id,
              token,
              new Date(Date.now() + LINK_LIFETIME_SECONDS * 1000),
            )
            .then(() =>
              sendLater(
                approveEmailChange(
                  user.email,
                  newEmail,
                  link,
                  config.webOrigin,
                ),
                "approve-email-change",
                user.id,
              ),
            )
            .catch((err: unknown) =>
              config.log.error(
                { err, userId: user.id },
                "approval link failed",
              ),
            );
        },
      },
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
        // Either sign-up may not own the inbox, so neither password is kept
        if (!user.emailVerified) {
          sendFinishLink(user);
          return;
        }
        sendNotice(
          existingAccount(user.email, config.webOrigin),
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
            const finish = finishing.delete(user.id);
            if (!fresh) return;
            if (finish) {
              const link = new URL(url);
              link.searchParams.set("callbackURL", FINISH_SIGN_UP_PATH);
              sendLater(
                finishSignUp(user.email, link.toString()),
                "finish-sign-up",
                user.id,
              );
              return;
            }
            sendLater(
              resetPassword(user.email, url),
              "reset-password",
              user.id,
            );
          })
          .catch((err: unknown) =>
            config.log.error({ err, userId: user.id }, "reset link failed"),
          );
      },
      onPasswordReset: async ({ user }, request) => {
        await resetLinks.revokeAll(user.id);
        // A new password proves the inbox, so earlier wrong guesses stop counting
        await signInFailures?.clear(user.email);
        // Opening the link proved they read this inbox
        if (!user.emailVerified) {
          await config.db
            .update(schema.users)
            .set({ emailVerified: true })
            .where(eq(schema.users.id, user.id));
        }
        if (request && firstPasswords.has(request)) return;
        sendPasswordChanged(user);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: LINK_LIFETIME_SECONDS,
      sendVerificationEmail: async ({ user, token }) => {
        const link = (extra: Record<string, string> = {}) =>
          `${config.webOrigin}${CONFIRM_EMAIL_PATH}?${new URLSearchParams({ token, ...extra })}`;
        await links.remember(
          user.id,
          token,
          new Date(Date.now() + LINK_LIFETIME_SECONDS * 1000),
        );
        // The second step of an email change comes here too, for the new address
        if (readChangeLink(token)) {
          sendLater(
            confirmNewEmail(user.email, link({ change: "1" })),
            "confirm-new-email",
            user.id,
          );
          return;
        }
        sendLater(verifyEmail(user.email, link()), "verify-email", user.id);
      },
    },
    rateLimit: {
      // Better Auth only limits in production by default. This keeps local the same.
      enabled: config.rateLimit ?? true,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 10, max: 3 },
        "/change-password": CHANGE_PASSWORD_LIMIT,
        "/change-email": CHANGE_EMAIL_LIMIT,
        "/app-session": APP_SESSION_LIMIT,
        "/approve-email-change": APPROVE_EMAIL_CHANGE_LIMIT,
        "/confirm-email": CONFIRM_EMAIL_LIMIT,
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

  verifyPressed = async (token, headers) => {
    pressed.add(token);
    try {
      await auth.api.verifyEmail({ query: { token }, headers });
      return true;
    } catch (err) {
      if (isAPIError(err)) return false;
      throw err;
    } finally {
      pressed.delete(token);
    }
  };

  // Drops the unconfirmed password and emails a link to choose one, which also confirms the email
  sendFinishLink = (user) => {
    config.db
      .delete(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, user.id),
          eq(schema.accounts.providerId, "credential"),
        ),
      )
      .then(() => {
        finishing.add(user.id);
        return auth.api.requestPasswordReset({
          body: { email: user.email, redirectTo: RESET_PASSWORD_PATH },
        });
      })
      .catch((err: unknown) => {
        finishing.delete(user.id);
        config.log.error({ err, userId: user.id }, "finish sign-up failed");
      });
  };

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
