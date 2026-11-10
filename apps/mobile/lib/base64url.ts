/** Base64 in the URL-safe alphabet with no padding, as RFC 7636 Appendix A describes */
export function toBase64Url(base64: string) {
  return base64.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function bytesToBase64Url(bytes: Uint8Array) {
  return toBase64Url(btoa(String.fromCharCode(...bytes)));
}
