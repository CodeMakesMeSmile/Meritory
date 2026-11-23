import { createRecallApi } from "@meritory/recall-client";
import { authClient, webOrigin } from "./auth-client";
import { loadContent } from "./content-copy";
import { contentFiles } from "./content-files";

const base = () => `${webOrigin()}/api/v1`;

/** The phone sends its session cookie itself, so requests go out with credentials omitted */
export async function sessionHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}

export const recallApi = createRecallApi({
  baseUrl: base(),
  headers: sessionHeaders,
  credentials: "omit",
});

export const fetchContent = () =>
  loadContent({
    url: `${base()}/content`,
    headers: sessionHeaders,
    store: contentFiles,
  });
