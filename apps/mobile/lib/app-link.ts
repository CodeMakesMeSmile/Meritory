/** The router only needs the page, and route params would keep the session in memory */
export function pageFromLink(link: string) {
  return link.split(/[?#]/)[0] ?? link;
}

/** What a provider sent back in the link to the app */
export function providerReturn(link: string) {
  const params = new URLSearchParams(link.split("#")[0]?.split("?")[1] ?? "");
  return {
    provider: params.get("provider"),
    error: params.get("error"),
    linked: params.get("linked"),
  };
}
