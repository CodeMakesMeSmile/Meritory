import "server-only";
import type {
  ContentResponse,
  InterviewDateResponse,
  MeResponse,
  RecallDueResponse,
  RecallSessionResponse,
  SettingsResponse,
} from "@meritory/contracts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

async function send(
  route: string,
  path: string,
  extra: Record<string, string> = {},
): Promise<Response> {
  const cookie = (await headers()).get("cookie") ?? "";
  // Next's own cache would key on the cookie, so it never shares anything here
  const res = await fetch(`${API_ORIGIN}${route}`, {
    headers: { cookie, ...extra },
    cache: "no-store",
  });
  if (res.status === 401) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  if (!res.ok && res.status !== 304) {
    throw new Error(`GET ${route} failed with ${res.status}`);
  }
  return res;
}

/**
 * Reads a signed-in API route with this request's cookie. An invalid session
 * goes to sign in, and comes back to path afterwards.
 */
export async function serverGet<T>(route: string, path: string): Promise<T> {
  return (await (await send(route, path)).json()) as T;
}

/** The signed-in user, or a trip to sign in when the session isn't valid */
export function requireMe(path: string): Promise<MeResponse> {
  return serverGet<MeResponse>("/v1/me", path);
}

// The bundle is the same for every learner, so one copy serves until its ETag changes
let bundle: { etag: string; content: ContentResponse } | null = null;

/** Every chapter and card, read once per page request and sent again only when changed */
export const getContent = cache(async (path: string) => {
  const kept = bundle;
  const res = await send(
    "/v1/content",
    path,
    kept ? { "if-none-match": kept.etag } : {},
  );
  if (res.status === 304 && kept) return kept.content;
  const content = (await res.json()) as ContentResponse;
  const etag = res.headers.get("etag");
  bundle = etag ? { etag, content } : null;
  return content;
});

export function getDue(path: string): Promise<RecallDueResponse> {
  return serverGet<RecallDueResponse>("/v1/recall/due", path);
}

export function getSession(path: string): Promise<RecallSessionResponse> {
  return serverGet<RecallSessionResponse>("/v1/recall/session", path);
}

export function getInterviewDate(path: string): Promise<InterviewDateResponse> {
  return serverGet<InterviewDateResponse>("/v1/me/interview-date", path);
}

export function getSettings(path: string): Promise<SettingsResponse> {
  return serverGet<SettingsResponse>("/v1/me/settings", path);
}
