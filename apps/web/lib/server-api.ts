import "server-only";
import type {
  ContentResponse,
  MeResponse,
  RecallDueResponse,
  RecallSessionResponse,
} from "@meritory/contracts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

/**
 * Reads a signed-in API route with this request's cookie. An invalid session
 * goes to sign in, and comes back to path afterwards.
 */
export async function serverGet<T>(route: string, path: string): Promise<T> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${API_ORIGIN}${route}`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (res.status === 401) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`GET ${route} failed with ${res.status}`);
  return (await res.json()) as T;
}

/** The signed-in user, or a trip to sign in when the session isn't valid */
export function requireMe(path: string): Promise<MeResponse> {
  return serverGet<MeResponse>("/v1/me", path);
}

/** Every chapter and card, read once per page request */
export const getContent = cache((path: string) =>
  serverGet<ContentResponse>("/v1/content", path),
);

export function getDue(path: string): Promise<RecallDueResponse> {
  return serverGet<RecallDueResponse>("/v1/recall/due", path);
}

export function getSession(path: string): Promise<RecallSessionResponse> {
  return serverGet<RecallSessionResponse>("/v1/recall/session", path);
}
