/** The router only needs the page, and route params would keep the sign-in code in memory */
export function pageFromLink(link: string) {
  return link.split(/[?#]/)[0] ?? link;
}

// The server's codes are 32 random bytes in base64url
const CODE = /^[\w-]{43}$/;

/** What a provider sent back in the link to the app */
export function providerReturn(link: string) {
  const params = new URLSearchParams(link.split("#")[0]?.split("?")[1] ?? "");
  const code = params.get("code");
  return {
    provider: params.get("provider"),
    error: params.get("error"),
    linked: params.get("linked"),
    code: code && CODE.test(code) ? code : null,
  };
}
