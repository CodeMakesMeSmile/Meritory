import { describe, expect, it } from "vitest";
import { isChallenge, s256 } from "./app-codes.ts";

// The worked example in RFC 7636, Appendix B
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

describe("s256", () => {
  it("matches the RFC 7636 example", () => {
    expect(s256(VERIFIER)).toBe(CHALLENGE);
  });
});

describe("isChallenge", () => {
  it("takes an S256 challenge", () => {
    expect(isChallenge(CHALLENGE)).toBe(true);
  });

  it.each([
    ["too short", CHALLENGE.slice(1)],
    ["too long", `${CHALLENGE}A`],
    ["padded", `${CHALLENGE.slice(1)}=`],
    ["plain base64", CHALLENGE.replace("-", "+")],
    ["not a string", 43],
    ["missing", undefined],
  ])("refuses one that is %s", (_, value) => {
    expect(isChallenge(value)).toBe(false);
  });
});
