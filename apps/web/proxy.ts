import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { contentSecurityPolicy, createNonce, NONCE_HEADER } from "./lib/csp";

const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/check-email",
  "/email-confirmed",
  "/forgot-password",
  "/reset-password",
]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Only checks that a session cookie exists. Pages ask the API whether it's valid.
  if (!PUBLIC_PATHS.has(pathname) && !getSessionCookie(request)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  // Next reads the policy from the request and adds the nonce to its own tags
  const nonce = createNonce();
  const policy = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER, nonce);
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  // Skips the API, Next's own files, and anything with a file extension
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
