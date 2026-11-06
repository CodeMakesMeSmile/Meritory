import type { MeResponse } from "@meritory/contracts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

/** The signed-in user, or a trip to sign in when the session isn't valid */
export async function requireMe(path: string): Promise<MeResponse> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${API_ORIGIN}/v1/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (res.status === 401) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`GET /v1/me failed with ${res.status}`);
  return (await res.json()) as MeResponse;
}
