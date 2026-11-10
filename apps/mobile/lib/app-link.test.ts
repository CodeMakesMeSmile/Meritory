import { describe, expect, it } from "vitest";
import { pageFromLink, providerReturn } from "./app-link.ts";

const APP = "app.meritory.mobile://";

describe("pageFromLink", () => {
  it.each([
    [`${APP}/?cookie=secret&linked=github`, `${APP}/`],
    [`${APP}/sign-in?provider=github&error=access_denied`, `${APP}/sign-in`],
    ["/?cookie=secret", "/"],
    ["/?%63ookie=secret", "/"],
    ["/#cookie=secret", "/"],
    ["/sign-in", "/sign-in"],
    ["exp://10.0.2.2:8081/--/?cookie=secret", "exp://10.0.2.2:8081/--/"],
  ])("turns %j into %j", (link, page) => {
    expect(pageFromLink(link)).toBe(page);
  });
});

describe("providerReturn", () => {
  it("reads an error", () => {
    expect(
      providerReturn(`${APP}/sign-in?provider=github&error=access_denied`),
    ).toEqual({
      provider: "github",
      error: "access_denied",
      linked: null,
      code: null,
    });
  });

  it("reads a code", () => {
    const code = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    expect(providerReturn(`${APP}/?code=${code}&linked=github`).code).toBe(
      code,
    );
  });

  it.each([
    ["too short", "abc"],
    ["too long", "A".repeat(44)],
    ["outside base64url", `${"A".repeat(42)}+`],
    ["empty", ""],
  ])("ignores a code that is %s", (_, code) => {
    expect(
      providerReturn(`${APP}/?code=${encodeURIComponent(code)}`).code,
    ).toBeNull();
  });

  it("reads a linked provider", () => {
    expect(providerReturn(`${APP}/?linked=google&cookie=x`).linked).toBe(
      "google",
    );
  });

  it("finds nothing in a link with no query or a broken one", () => {
    const empty = { provider: null, error: null, linked: null, code: null };
    expect(providerReturn(`${APP}/`)).toEqual(empty);
    expect(providerReturn("")).toEqual(empty);
    expect(providerReturn("?%E0%A4%A")).toEqual(empty);
  });

  it("ignores anything after a fragment", () => {
    expect(providerReturn(`${APP}/#?error=access_denied`).error).toBeNull();
  });
});
