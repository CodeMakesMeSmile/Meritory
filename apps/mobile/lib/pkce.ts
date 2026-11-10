import * as Crypto from "expo-crypto";
import { bytesToBase64Url, toBase64Url } from "./base64url";

/**
 * A fresh verifier for one sign-in, kept only in memory, and the S256 challenge the server
 * stores. The async random call never falls back to Math.random, unlike getRandomBytes.
 */
export async function createPkce() {
  const verifier = bytesToBase64Url(await Crypto.getRandomBytesAsync(32));
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return { verifier, challenge: toBase64Url(digest) };
}
