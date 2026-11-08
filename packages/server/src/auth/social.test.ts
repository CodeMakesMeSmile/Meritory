import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../db/client.ts";
import { accounts, sessions, users, verifications } from "../db/schema.ts";
import type { Mail, MailTag } from "../mail/mailer.ts";
import { createAccountSessions } from "./account-sessions.ts";
import { createAuth } from "./auth.ts";

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
    appScheme: "meritory://",
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

  const startSignIn = async (body: object, cookie?: string) => {
    const res = await auth.handler(
      new Request(`${ORIGIN}/api/v1/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
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
  ) => {
    const { to, cookies } = await startSignIn(body, cookie);
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
    const methods = () =>
      createAccountSessions(db, auth).signInMethods(user?.id ?? "");
    expect(await methods()).toEqual({ password: false, providers: ["github"] });

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
    expect(await methods()).toEqual({ password: true, providers: ["github"] });
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
});
