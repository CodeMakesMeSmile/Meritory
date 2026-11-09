import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../db/client.ts";
import {
  accounts,
  sessions,
  unlinkedProviders,
  users,
  verifications,
} from "../db/schema.ts";
import type { Mail, MailTag } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";
import { createSignInMethods } from "./sign-in-methods.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const LINKED = "GitHub was added to your Meritory account";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  emails: { email: string; primary: boolean; verified: boolean }[];
}

/** Stands in for github.com, so the whole sign-in runs without a network */
function fakeGitHub(user: GitHubUser) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const target = String(input instanceof Request ? input.url : input);
      if (target.startsWith("https://github.com/login/oauth/access_token")) {
        return Response.json({
          access_token: "gho_secret_access",
          refresh_token: "ghr_secret_refresh",
          expires_in: 28800,
          token_type: "bearer",
          scope: "read:user,user:email",
        });
      }
      if (target === "https://api.github.com/user/emails") {
        return Response.json(user.emails);
      }
      if (target === "https://api.github.com/user") {
        const { emails: _, ...profile } = user;
        return Response.json({ ...profile, avatar_url: "" });
      }
      throw new Error(`unexpected fetch ${target}`);
    }),
  );
}

describe.skipIf(!url)("GitHub and Google sign-in against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const sent: [Mail, MailTag][] = [];
  const auth = createAuth({
    db,
    secret: "x".repeat(32),
    baseUrl: `${ORIGIN}/api/v1/auth`,
    webOrigin: ORIGIN,
    appScheme: "app.meritory.mobile://",
    mailer: { send: async (mail, tag) => void sent.push([mail, tag]) },
    log: { error: () => {} },
    rateLimit: false,
    providers: {
      github: { clientId: "gh-client", clientSecret: "gh-secret" },
      google: { clientId: "g-client", clientSecret: "g-secret" },
    },
  });

  afterEach(() => vi.unstubAllGlobals());

  afterAll(async () => {
    const mine = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, "social-%@meritory.test"));
    const ids = mine.map(({ id }) => id);
    if (ids.length > 0) {
      await db.delete(verifications).where(
        inArray(
          verifications.identifier,
          ids.map((id) => `email-link:${id}`),
        ),
      );
      await db.delete(users).where(inArray(users.id, ids));
    }
    await database.close();
  });

  const pairs = (res: Response) =>
    res.headers.getSetCookie().map((cookie) => cookie.split(";")[0] ?? "");

  const sessionCookie = (res: Response) =>
    pairs(res).find((pair) => pair.includes("better-auth.session_token="));

  const startSignIn = async (
    body: object,
    cookie?: string,
    from: Record<string, string> = { origin: ORIGIN },
  ) => {
    const res = await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...from,
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(200);
    const { url: to } = (await res.json()) as { url: string };
    return { to: new URL(to), cookies: pairs(res) };
  };

  /** Starts sign-in, then comes back from GitHub with the given query */
  const roundTrip = async (
    query: Record<string, string>,
    body: object = { provider: "github", callbackURL: "/account" },
    cookie?: string,
    from?: Record<string, string>,
  ) => {
    const { to, cookies } = await startSignIn(body, cookie, from);
    const state = to.searchParams.get("state") ?? "";
    const back = new URL(`${ORIGIN}/api/v1/auth/callback/github`);
    for (const [key, value] of Object.entries({ state, ...query })) {
      back.searchParams.set(key, value);
    }
    const res = await auth.handler(
      new Request(back, {
        headers: {
          cookie: [...cookies, ...(cookie ? [cookie] : [])].join("; "),
        },
      }),
    );
    return { res, location: res.headers.get("location") ?? "" };
  };

  const ghUser = (overrides: Partial<GitHubUser> = {}): GitHubUser => {
    const email = `social-${randomUUID()}@meritory.test`;
    return {
      id: Math.floor(Math.random() * 1e9),
      login: "rowan-gh",
      name: "Rowan Lee",
      emails: [{ email, primary: true, verified: true }],
      ...overrides,
    };
  };

  const userByEmail = async (email: string) => {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  };

  const accountsOf = (userId: string) =>
    db.select().from(accounts).where(eq(accounts.userId, userId));

  const signUp = async (email: string, verified: boolean) => {
    await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ name: "Rowan", email, password: PASSWORD }),
      }),
    );
    await db
      .update(users)
      .set({ emailVerified: verified })
      .where(eq(users.email, email));
  };

  describe("from the phone app", () => {
    const APP = "app.meritory.mobile://";
    const fromApp = { "expo-origin": APP };
    const asked = {
      provider: "github",
      callbackURL: `${APP}/somewhere-else`,
      errorCallbackURL: `${APP}/elsewhere`,
    };

    const roundTripFromApp = (query: Record<string, string>) =>
      roundTrip(query, asked, undefined, fromApp);

    const cookieIn = (location: string) =>
      new URL(location).searchParams.get("cookie") ?? "";

    it("returns to the app's home with the session", async () => {
      fakeGitHub(ghUser());
      const { res, location } = await roundTripFromApp({ code: "c" });
      expect(res.status).toBe(302);
      expect(location.startsWith(`${APP}/?cookie=`)).toBe(true);
      expect(cookieIn(location)).toContain("better-auth.session_token=");
    });

    it("says a provider was linked, and still returns the session", async () => {
      const gh = ghUser();
      await signUp(gh.emails[0]?.email ?? "", true);
      fakeGitHub(gh);
      const { location } = await roundTripFromApp({ code: "c" });
      expect(location.startsWith(`${APP}/?`)).toBe(true);
      const params = new URL(location).searchParams;
      expect(params.get("linked")).toBe("github");
      expect(params.get("cookie")).toContain("better-auth.session_token=");
    });

    it("returns a cancel to the app's sign in, with no session", async () => {
      const { location } = await roundTripFromApp({ error: "access_denied" });
      expect(location.startsWith(`${APP}/sign-in?provider=github`)).toBe(true);
      const params = new URL(location).searchParams;
      expect(params.get("error")).toBe("access_denied");
      expect(params.get("cookie") ?? "").not.toContain("session_token");
    });

    it("refuses a return address outside the app", async () => {
      const res = await auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/sign-in/social`, {
          method: "POST",
          headers: { "content-type": "application/json", ...fromApp },
          body: JSON.stringify({ ...asked, callbackURL: "evil://steal" }),
        }),
      );
      expect(res.status).toBe(403);
    });

    it("keeps a website request on the website", async () => {
      fakeGitHub(ghUser());
      const { location } = await roundTrip({ code: "c" }, asked);
      expect(location).toBe("/");
    });

    it("lets a browser's own origin outrank the phone header", async () => {
      fakeGitHub(ghUser());
      const { location } = await roundTrip({ code: "c" }, asked, undefined, {
        origin: ORIGIN,
        ...fromApp,
      });
      expect(location).toBe("/");
    });
  });

  it("creates a new account, signed in, with a clean name and no tokens", async () => {
    const gh = ghUser({ name: "Rowan\u0000\nLee" });
    fakeGitHub(gh);
    const { res, location } = await roundTrip({ code: "c" });
    expect(res.status).toBe(302);
    expect(location).toBe("/account");
    expect(sessionCookie(res)).toBeDefined();
    const user = await userByEmail(gh.emails[0]?.email ?? "");
    expect(user).toMatchObject({ name: "Rowan Lee", emailVerified: true });
    const [account] = await accountsOf(user?.id ?? "");
    expect(account).toMatchObject({
      providerId: "github",
      accountId: String(gh.id),
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
    expect(sent.filter(([mail]) => mail.to === user?.email)).toEqual([]);
  });

  it("has no password until one is set from the emailed link", async () => {
    const gh = ghUser();
    const email = gh.emails[0]?.email ?? "";
    fakeGitHub(gh);
    await roundTrip({ code: "c" });
    vi.unstubAllGlobals();
    const user = await userByEmail(email);
    const hasPassword = async () =>
      (
        await createSignInMethods({
          db,
          mailer: { send: async () => {} },
          webOrigin: ORIGIN,
          log: { error: () => {} },
        }).list(user?.id ?? "")
      ).passwordSetAt !== null;
    expect(await hasPassword()).toBe(false);

    const post = (path: string, body: object) =>
      auth.handler(
        new Request(`${ORIGIN}/api/v1/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify(body),
        }),
      );
    await post("/request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    const token = () =>
      sent
        .filter(([mail]) => mail.to === email)
        .map(([mail]) => mail.text.match(/\/reset-password\/([^?\s]+)/)?.[1])
        .find(Boolean);
    await expect.poll(token).toBeDefined();
    const reset = await post("/reset-password", {
      token: token(),
      newPassword: PASSWORD,
    });
    expect(reset.status).toBe(200);
    expect(await hasPassword()).toBe(true);
  });

  it("refuses a Google account whose email Google hasn't verified", async () => {
    const validate = auth.options.user?.validateUserInfo;
    const check = (method: "oauth" | "email", emailVerified: boolean) =>
      validate?.({
        user: { email: "social-x@meritory.test", emailVerified },
        source: {
          action: "create-user",
          method,
          ...(method === "oauth"
            ? { oauth: { providerId: "google" } as never }
            : {}),
        },
      });
    expect(await check("oauth", false)).toEqual({
      error: "email_not_verified",
    });
    expect(await check("oauth", true)).toBeUndefined();
    // Sign-up confirms the email itself, by link
    expect(await check("email", false)).toBeUndefined();
  });

  it("refuses a GitHub account with no verified primary email", async () => {
    const email = `social-${randomUUID()}@meritory.test`;
    fakeGitHub(
      ghUser({
        emails: [
          { email, primary: true, verified: false },
          {
            email: `social-${randomUUID()}@meritory.test`,
            primary: false,
            verified: true,
          },
        ],
      }),
    );
    const { res, location } = await roundTrip({ code: "c" });
    expect(location).toBe("/sign-in?provider=github&error=email_not_found");
    expect(sessionCookie(res)).toBeUndefined();
    expect(await userByEmail(email)).toBeUndefined();
  });

  it("says when they cancel on GitHub, and creates nothing", async () => {
    const { res, location } = await roundTrip({
      error: "access_denied",
      error_description: "The user has denied your application access.",
    });
    expect(new URL(location, ORIGIN).pathname).toBe("/sign-in");
    expect(new URL(location, ORIGIN).searchParams.get("error")).toBe(
      "access_denied",
    );
    expect(sessionCookie(res)).toBeUndefined();
  });

  it("links to a confirmed account and tells the owner", async () => {
    const gh = ghUser();
    const email = gh.emails[0]?.email ?? "";
    await signUp(email, true);
    fakeGitHub(gh);
    const { res, location } = await roundTrip({ code: "c" });
    // Only a fresh link is flagged, and the session cookie survives the new redirect
    expect(location).toBe("/account?linked=github");
    const signedIn = await auth.api.getSession({
      headers: new Headers({ cookie: sessionCookie(res) ?? "" }),
    });
    expect(signedIn?.user.email).toBe(email);
    const user = await userByEmail(email);
    const linked = await accountsOf(user?.id ?? "");
    expect(linked.map((a) => a.providerId).sort()).toEqual([
      "credential",
      "github",
    ]);
    const linkedMails = () =>
      sent.filter(([mail]) => mail.to === email && mail.subject === LINKED);
    await expect.poll(linkedMails).toHaveLength(1);
    const [[mail, tag]] = linkedMails() as [[Mail, MailTag]];
    expect(tag).toEqual({ kind: "provider-linked", userId: user?.id });
    expect(mail.text).toContain(`${ORIGIN}/forgot-password`);
  });

  it("won't link to an account whose email isn't confirmed", async () => {
    const gh = ghUser();
    const email = gh.emails[0]?.email ?? "";
    await signUp(email, false);
    fakeGitHub(gh);
    const { res, location } = await roundTrip({ code: "c" });
    expect(location).toBe("/sign-in?provider=github&error=account_not_linked");
    expect(sessionCookie(res)).toBeUndefined();
    const user = await userByEmail(email);
    expect((await accountsOf(user?.id ?? "")).map((a) => a.providerId)).toEqual(
      ["credential"],
    );
  });

  it("refuses another site's URLs before leaving for GitHub", async () => {
    for (const body of [
      { callbackURL: "https://evil.example/" },
      { callbackURL: "//evil.example/path" },
      { errorCallbackURL: "https://evil.example" },
      { newUserCallbackURL: "https://evil.example/new" },
    ]) {
      const res = await auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/sign-in/social`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({ provider: "github", ...body }),
        }),
      );
      expect(res.status).toBe(403);
    }
  });

  it("sends errors only to our own pages, and new accounts to the same path", async () => {
    fakeGitHub(ghUser());
    const created = await roundTrip(
      { code: "c" },
      {
        provider: "github",
        callbackURL: "/account",
        newUserCallbackURL: "/welcome",
      },
    );
    expect(created.location).toBe("/account");
    const cancelled = await roundTrip(
      { error: "access_denied" },
      { provider: "github", errorCallbackURL: "/admin" },
    );
    expect(new URL(cancelled.location, ORIGIN).pathname).toBe("/sign-in");
  });

  it("replaces this browser's session when signing in again, and keeps no tokens", async () => {
    const gh = ghUser();
    fakeGitHub(gh);
    const first = await roundTrip({ code: "c" });
    const oldCookie = sessionCookie(first.res) ?? "";
    const old = await auth.api.getSession({
      headers: new Headers({ cookie: oldCookie }),
    });
    expect(old).not.toBeNull();
    const again = await roundTrip(
      { code: "c" },
      { provider: "github", callbackURL: "/account?confirmed=1" },
      oldCookie,
    );
    expect(again.location).toBe("/account?confirmed=1");
    const user = await userByEmail(gh.emails[0]?.email ?? "");
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user?.id ?? ""));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).not.toBe(old?.session.id);
    const [account] = await accountsOf(user?.id ?? "");
    expect(account?.accessToken).toBeNull();
    expect(account?.refreshToken).toBeNull();
  });

  it("leaves another account's session alone", async () => {
    const someone = ghUser();
    fakeGitHub(someone);
    const theirs = sessionCookie((await roundTrip({ code: "c" })).res) ?? "";
    const other = ghUser();
    fakeGitHub(other);
    await roundTrip({ code: "c" }, undefined, theirs);
    const still = await auth.api.getSession({
      headers: new Headers({ cookie: theirs }),
    });
    expect(still).not.toBeNull();
  });

  it("always shows Google's account picker", async () => {
    const { to } = await startSignIn({ provider: "google", callbackURL: "/" });
    expect(to.origin).toBe("https://accounts.google.com");
    expect(to.searchParams.get("prompt")).toBe("select_account");
    expect(to.searchParams.get("code_challenge_method")).toBe("S256");
    expect(to.searchParams.get("scope")?.split(" ").sort()).toEqual([
      "email",
      "openid",
      "profile",
    ]);
  });

  describe("managing sign-in methods", () => {
    const REMOVED = "GitHub was removed from your Meritory account";
    const methods = createSignInMethods({
      db,
      mailer: { send: async (mail, tag) => void sent.push([mail, tag]) },
      webOrigin: ORIGIN,
      providers: { github: { clientId: "gh", clientSecret: "s" } },
      log: { error: () => {} },
    });

    const signIn = async (email: string) => {
      const res = await auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/sign-in/email`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({ email, password: PASSWORD }),
        }),
      );
      expect(res.status).toBe(200);
      return sessionCookie(res) ?? "";
    };

    /** An account with a password, signed in, and the GitHub user that matches it */
    const member = async () => {
      const gh = ghUser();
      const email = gh.emails[0]?.email ?? "";
      await signUp(email, true);
      const cookie = await signIn(email);
      const user = await userByEmail(email);
      return { gh, email, cookie, userId: user?.id ?? "" };
    };

    const startLink = (cookie: string, body: object = {}) =>
      auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/link-social`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie,
          },
          body: JSON.stringify({ provider: "github", ...body }),
        }),
      );

    /** Starts a link from Account, then comes back from GitHub */
    const linkTrip = async (
      cookie: string,
      query: Record<string, string> = { code: "c" },
      body: object = {},
    ) => {
      const started = await startLink(cookie, body);
      expect(started.status).toBe(200);
      const { url: to } = (await started.json()) as { url: string };
      const back = new URL(`${ORIGIN}/api/v1/auth/callback/github`);
      back.searchParams.set(
        "state",
        new URL(to).searchParams.get("state") ?? "",
      );
      for (const [key, value] of Object.entries(query)) {
        back.searchParams.set(key, value);
      }
      const res = await auth.handler(
        new Request(back, {
          headers: { cookie: [...pairs(started), cookie].join("; ") },
        }),
      );
      return new URL(res.headers.get("location") ?? "", ORIGIN);
    };

    const providersOf = async (userId: string) =>
      (await accountsOf(userId)).map((row) => row.providerId).sort();

    const makeStale = (userId: string) =>
      db
        .update(sessions)
        .set({ createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
        .where(eq(sessions.userId, userId));

    it("refuses a sign-in after an unlink, but not a link from Account", async () => {
      const { gh, cookie, userId } = await member();
      fakeGitHub(gh);
      const first = await linkTrip(cookie);
      expect(`${first.pathname}${first.search}`).toBe("/account?linked=github");
      expect(await methods.unlink(userId, "github")).toBe("unlinked");

      const refused = await roundTrip({ code: "c" });
      const to = new URL(refused.location, ORIGIN);
      expect(to.pathname).toBe("/sign-in");
      expect(to.searchParams.get("provider")).toBe("github");
      expect(to.searchParams.get("error")).toBe("provider_unlinked");
      expect(sessionCookie(refused.res)).toBeUndefined();
      expect(await providersOf(userId)).toEqual(["credential"]);

      const again = await linkTrip(cookie);
      expect(`${again.pathname}${again.search}`).toBe("/account?linked=github");
      expect(await providersOf(userId)).toEqual(["credential", "github"]);
      expect(
        await db
          .select()
          .from(unlinkedProviders)
          .where(eq(unlinkedProviders.userId, userId)),
      ).toEqual([]);

      const allowed = await roundTrip({ code: "c" });
      expect(allowed.location).toBe("/account");
      expect(sessionCookie(allowed.res)).toBeDefined();
    });

    it("only refuses the provider that was unlinked", async () => {
      const { gh, userId } = await member();
      await db
        .insert(accounts)
        .values({ userId, providerId: "google", accountId: randomUUID() });
      expect(await methods.unlink(userId, "google")).toBe("unlinked");
      fakeGitHub(gh);
      const { location } = await roundTrip({ code: "c" });
      expect(location).toBe("/account?linked=github");
    });

    it("always returns a link to Account, whatever the client asked for", async () => {
      const { gh, cookie } = await member();
      fakeGitHub(gh);
      const cancelled = await linkTrip(
        cookie,
        { error: "access_denied" },
        { callbackURL: "/elsewhere", errorCallbackURL: "/admin" },
      );
      expect(cancelled.pathname).toBe("/account");
      expect(cancelled.searchParams.get("provider")).toBe("github");
      expect(cancelled.searchParams.get("error")).toBe("access_denied");
      const linked = await linkTrip(
        cookie,
        { code: "c" },
        {
          callbackURL: "/elsewhere",
        },
      );
      expect(`${linked.pathname}${linked.search}`).toBe(
        "/account?linked=github",
      );
    });

    it("refuses a GitHub account with a different email", async () => {
      const { cookie, userId } = await member();
      fakeGitHub(ghUser());
      const to = await linkTrip(cookie);
      expect(to.pathname).toBe("/account");
      expect(to.searchParams.get("error")).toBe("email_does_not_match");
      expect(await providersOf(userId)).toEqual(["credential"]);
    });

    it("refuses a GitHub account another Meritory account has", async () => {
      const taken = ghUser();
      fakeGitHub(taken);
      await roundTrip({ code: "c" });
      const { email, cookie, userId } = await member();
      fakeGitHub({
        ...taken,
        emails: [{ email, primary: true, verified: true }],
      });
      const to = await linkTrip(cookie);
      expect(to.searchParams.get("error")).toBe(
        "account_already_linked_to_different_user",
      );
      expect(await providersOf(userId)).toEqual(["credential"]);
    });

    it("asks for a fresh sign-in before starting a link", async () => {
      const { cookie, userId } = await member();
      await makeStale(userId);
      const stale = await startLink(cookie);
      expect(stale.status).toBe(403);
      expect(await stale.json()).toMatchObject({ code: "confirm_password" });
      await db
        .update(sessions)
        .set({ confirmedAt: new Date() })
        .where(eq(sessions.userId, userId));
      expect((await startLink(cookie)).status).toBe(200);
    });

    it("won't link from a token sent straight to the route", async () => {
      const { cookie, userId } = await member();
      const res = await startLink(cookie, { idToken: { token: "t" } });
      expect(res.status).toBe(400);
      expect(await providersOf(userId)).toEqual(["credential"]);
    });

    it("turns off Better Auth's own unlink route", async () => {
      const { cookie } = await member();
      const res = await auth.handler(
        new Request(`${ORIGIN}/api/v1/auth/unlink-account`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie,
          },
          body: JSON.stringify({ accountId: randomUUID() }),
        }),
      );
      expect(res.status).toBe(404);
    });

    it("removes the provider, emails the owner, and keeps other sessions", async () => {
      const { gh, email, cookie, userId } = await member();
      fakeGitHub(gh);
      await linkTrip(cookie);
      expect(await methods.unlink(userId, "github")).toBe("unlinked");
      expect(await providersOf(userId)).toEqual(["credential"]);
      const removed = () =>
        sent.filter(([mail]) => mail.to === email && mail.subject === REMOVED);
      await expect.poll(removed).toHaveLength(1);
      const [[mail, tag]] = removed() as [[Mail, MailTag]];
      expect(tag).toEqual({ kind: "provider-unlinked", userId });
      expect(mail.text).toContain(`${ORIGIN}/forgot-password`);
      expect(
        await auth.api.getSession({ headers: new Headers({ cookie }) }),
      ).not.toBeNull();
    });

    it("answers not_linked for a provider the account doesn't have", async () => {
      const { userId } = await member();
      expect(await methods.unlink(userId, "github")).toBe("not_linked");
    });

    it("won't remove the only way to sign in", async () => {
      const gh = ghUser();
      fakeGitHub(gh);
      await roundTrip({ code: "c" });
      const user = await userByEmail(gh.emails[0]?.email ?? "");
      const userId = user?.id ?? "";
      expect(await methods.unlink(userId, "github")).toBe("last_method");
      // A credential row with no password can't sign anyone in
      await db.insert(accounts).values({
        userId,
        providerId: "credential",
        accountId: userId,
      });
      expect(await methods.unlink(userId, "github")).toBe("last_method");
      expect(await providersOf(userId)).toEqual(["credential", "github"]);
    });

    it("keeps one method when two unlinks run at once", async () => {
      const gh = ghUser();
      fakeGitHub(gh);
      await roundTrip({ code: "c" });
      const user = await userByEmail(gh.emails[0]?.email ?? "");
      const userId = user?.id ?? "";
      await db
        .insert(accounts)
        .values({ userId, providerId: "google", accountId: randomUUID() });
      const results = await Promise.all([
        methods.unlink(userId, "github"),
        methods.unlink(userId, "google"),
      ]);
      expect(results.sort()).toEqual(["last_method", "unlinked"]);
      expect(await providersOf(userId)).toHaveLength(1);
    });

    it("lists dates, and only providers this server can link", async () => {
      const { gh, cookie, userId } = await member();
      fakeGitHub(gh);
      await linkTrip(cookie);
      const list = await methods.list(userId);
      expect(list.available).toEqual(["github"]);
      expect(list.providers).toEqual([
        { id: "github", linkedAt: expect.any(String) },
      ]);
      expect(list.passwordSetAt).toEqual(expect.any(String));
    });
  });
});
