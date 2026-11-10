import { describe, expect, it } from "vitest";
import { bytesToBase64Url, toBase64Url } from "./base64url.ts";

// The worked example in RFC 7636, Appendix B
const OCTETS = [
  116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187, 186,
  22, 212, 37, 77, 105, 214, 191, 240, 91, 88, 5, 88, 83, 132, 141, 121,
];
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

describe("base64url", () => {
  it("turns the RFC's random bytes into its verifier", () => {
    expect(bytesToBase64Url(new Uint8Array(OCTETS))).toBe(VERIFIER);
  });

  it("turns the verifier's SHA-256 in plain base64 into the RFC's challenge", () => {
    expect(toBase64Url("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw+cM=")).toBe(
      CHALLENGE,
    );
  });

  it("swaps both URL-unsafe characters and drops padding", () => {
    expect(toBase64Url("a+b/c==")).toBe("a-b_c");
  });
});
