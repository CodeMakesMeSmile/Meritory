import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/check-email",
  "/email-confirmed",
  "/forgot-password",
  "/reset-password",
]);

// Only checks that a session cookie exists. Pages ask the API whether it's valid.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || getSessionCookie(request)) {
    return NextResponse.next();
  }
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Skips the API, Next's own files, and anything with a file extension
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
