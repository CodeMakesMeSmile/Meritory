import type { ContentResponse } from "@meritory/contracts";

/** Where the phone keeps the bundle's text between launches */
export interface ContentStore {
  read(): Promise<string | null>;
  write(text: string): Promise<void>;
  clear(): Promise<void>;
}

export type ContentResult =
  | { ok: true; content: ContentResponse }
  | { ok: false; reason: "signed_out" | "failed" };

export interface ContentRequest {
  /** The full address of GET /v1/content */
  url: string;
  headers: () => Record<string, string> | Promise<Record<string, string>>;
  store: ContentStore;
}

/** A light check, since the API already checked the bundle against its schema */
export function parseContent(text: string): ContentResponse | null {
  try {
    const value = JSON.parse(text) as Partial<ContentResponse> | null;
    const fits =
      value !== null &&
      typeof value === "object" &&
      typeof value.hash === "string" &&
      /^[0-9a-f]{64}$/.test(value.hash) &&
      Array.isArray(value.tracks);
    return fits ? (value as ContentResponse) : null;
  } catch {
    return null;
  }
}

async function kept(store: ContentStore): Promise<ContentResponse | null> {
  const text = await store.read().catch(() => null);
  if (text === null) return null;
  const content = parseContent(text);
  // A copy that can't be read is thrown away, so the next fetch replaces it
  if (!content) await store.clear().catch(() => {});
  return content;
}

/**
 * The content bundle, downloaded only when it changed. The bundle's hash is its
 * ETag, so the kept copy needs no separate tag. When the API can't be reached
 * or sends something else, the kept copy still answers.
 */
export async function loadContent(
  request: ContentRequest,
): Promise<ContentResult> {
  const copy = await kept(request.store);
  const fallBack = (): ContentResult =>
    copy ? { ok: true, content: copy } : { ok: false, reason: "failed" };
  let res: Response;
  try {
    res = await fetch(request.url, {
      credentials: "omit",
      headers: {
        ...(await request.headers()),
        ...(copy ? { "If-None-Match": `"${copy.hash}"` } : {}),
      },
    });
  } catch {
    return fallBack();
  }
  if (res.status === 401) return { ok: false, reason: "signed_out" };
  if (!res.ok) return fallBack();
  const text = await res.text().catch(() => null);
  const content = text === null ? null : parseContent(text);
  if (text === null || !content) return fallBack();
  // A failed save only costs another download next time
  await request.store.write(text).catch(() => {});
  return { ok: true, content };
}
