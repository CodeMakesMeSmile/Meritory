import { describe, expect, it, vi } from "vitest";
import {
  appReturnAddress,
  githubUserInfo,
  providerName,
  providerRedirects,
  socialProviders,
  withLinked,
  withoutTokens,
} from "./providers.ts";

describe("providerName", () => {
  it("applies the sign-up rule to provider names", () => {
    expect(providerName("Rowan\u0000 Lee\n", "rowan")).toBe("Rowan Lee");
    expect(providerName("  ", "rowan-gh")).toBe("rowan-gh");
    expect(providerName(null, "")).toBe("Meritory learner");
    expect(providerName("x".repeat(300), "")).toHaveLength(100);
  });
});

describe("providerRedirects", () => {
  it.each([
    ["/account?tab=1", "/account?tab=1"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["https://evil.example/", "/"],
    ["javascript:alert(1)", "/"],
    ["/ok\nLocation: x", "/"],
    [undefined, "/"],
  ])("sends %j back to %j", (callbackURL, expected) => {
    expect(providerRedirects("github", { callbackURL }).callbackURL).toBe(
      expected,
    );
  });

  it("only lets errors land on sign in or Account", () => {
    expect(
      providerRedirects("google", { errorCallbackURL: "/account" })
        .errorCallbackURL,
    ).toBe("/account?provider=google");
    for (const errorCallbackURL of ["https://evil.example", "/admin", 42]) {
      expect(
        providerRedirects("github", { errorCallbackURL }).errorCallbackURL,
      ).toBe("/sign-in?provider=github");
    }
  });
});

describe("appReturnAddress", () => {
  const APP = "app.meritory.mobile://";

  it.each([
    [APP, `${APP}/`],
    [`${APP}/anything?x=1`, `${APP}/`],
    ["exp://192.168.1.20:8081", "exp://192.168.1.20:8081/--/"],
    ["exp://192.168.1.20:8081/--/", "exp://192.168.1.20:8081/--/"],
  ])("gives %j the address %j", (origin, expected) => {
    expect(appReturnAddress(origin, APP, "exp://")).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["https://meritory.test"],
    ["https://evil.example"],
    ["meritory://"],
    ["evil://app.meritory.mobile://"],
  ])("gives %j nothing", (origin) => {
    expect(appReturnAddress(origin, APP, "exp://")).toBeNull();
  });

  it("ignores Expo Go when it isn't trusted", () => {
    expect(appReturnAddress("exp://192.168.1.20:8081", APP)).toBeNull();
  });
});

describe("providerRedirects for the phone app", () => {
  const address = "app.meritory.mobile:///";

  it("uses the app's address, whatever the request asked for", () => {
    expect(
      providerRedirects(
        "github",
        {
          callbackURL: "https://evil.example/",
          errorCallbackURL: "evil://steal",
        },
        address,
      ),
    ).toEqual({
      callbackURL: address,
      errorCallbackURL: `${address}sign-in?provider=github`,
      newUserCallbackURL: address,
    });
  });
});

describe("withLinked", () => {
  it("adds the provider to the landing path and keeps the rest", () => {
    expect(withLinked("/", "github")).toBe("/?linked=github");
    expect(withLinked("app.meritory.mobile:///", "github")).toBe(
      "app.meritory.mobile:///?linked=github",
    );
    expect(withLinked("/account?tab=1#sessions", "google")).toBe(
      "/account?tab=1&linked=google#sessions",
    );
    expect(withLinked("/?linked=evil", "github")).toBe("/?linked=github");
  });
});

describe("withoutTokens", () => {
  it("drops every token and its expiry", () => {
    const kept = withoutTokens({
      providerId: "github",
      accessToken: "gho_secret",
      refreshToken: "ghr_secret",
      idToken: "id",
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
    });
    expect(kept).toEqual({
      providerId: "github",
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
  });
});

describe("githubUserInfo", () => {
  const profile = { id: 7, login: "rowan-gh", name: null, avatar_url: "a" };
  const fetcher = (emails: unknown) =>
    vi.fn(async (url: string | URL | Request) =>
      Response.json(String(url).endsWith("/emails") ? emails : profile),
    ) as unknown as typeof fetch;

  it("takes the verified primary email, even when private", async () => {
    const info = await githubUserInfo(
      { accessToken: "t" },
      fetcher([
        { email: "public@meritory.test", primary: false, verified: true },
        { email: "primary@meritory.test", primary: true, verified: true },
      ]),
    );
    expect(info?.user).toMatchObject({
      email: "primary@meritory.test",
      emailVerified: true,
      name: "rowan-gh",
    });
  });

  it("leaves the email empty without a verified primary", async () => {
    const info = await githubUserInfo(
      { accessToken: "t" },
      fetcher([
        { email: "primary@meritory.test", primary: true, verified: false },
        { email: "other@meritory.test", primary: false, verified: true },
      ]),
    );
    expect(info?.user).toMatchObject({ email: null, emailVerified: false });
  });

  it("gives up when GitHub refuses", async () => {
    const refused = vi.fn(
      async () => new Response("", { status: 401 }),
    ) as unknown as typeof fetch;
    expect(await githubUserInfo({ accessToken: "t" }, refused)).toBeNull();
  });
});

describe("socialProviders", () => {
  it("adds only providers with credentials", () => {
    expect(Object.keys(socialProviders({}))).toEqual([]);
    const both = socialProviders({
      github: { clientId: "a", clientSecret: "b" },
      google: { clientId: "c", clientSecret: "d" },
    });
    expect(Object.keys(both)).toEqual(["github", "google"]);
    expect(both.google?.prompt).toBe("select_account");
  });
});
