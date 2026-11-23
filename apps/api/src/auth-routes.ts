import { API_PREFIX } from "@meritory/contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";

export interface AuthRouteDependencies {
  /** Better Auth's fetch handler */
  handleAuth(request: Request): Promise<Response>;
  /** The API's public base URL, as browsers and the phone see it */
  publicApiUrl: string;
}

// Rebuilt by fetch or by Fastify, so copying them would only conflict
const SKIPPED_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
]);

/**
 * An allowlist, so a route Better Auth adds stays closed until it's listed here.
 * A :name part stands for one path segment.
 */
export const AUTH_ROUTES = {
  GET: [
    "/get-session",
    "/verify-email",
    "/reset-password/:token",
    "/callback/:provider",
    "/expo-authorization-proxy",
    "/error",
  ],
  POST: [
    "/sign-up/email",
    "/sign-in/email",
    "/sign-in/social",
    "/sign-out",
    "/send-verification-email",
    "/request-password-reset",
    "/reset-password",
    "/change-password",
    "/change-email",
    "/approve-email-change",
    "/update-user",
    "/link-social",
    "/app-session",
  ],
} as const;

const AUTH_BASE = `${API_PREFIX}/auth`;

const ROUTE_PATTERNS = Object.fromEntries(
  Object.entries(AUTH_ROUTES).map(([method, paths]) => [
    method,
    paths.map((path) => new RegExp(`^${path.replace(/:[a-z]+/g, "[^/]+")}$`)),
  ]),
) as Record<string, RegExp[] | undefined>;

/** True when the request is for a listed route, read the way Better Auth will read it */
export function isAuthRoute(method: string, url: string): boolean {
  // Resolves dot segments the same way the Request handed to Better Auth does
  const { pathname } = new URL(url, "http://api.invalid");
  if (!pathname.startsWith(`${AUTH_BASE}/`)) return false;
  const path = pathname.slice(AUTH_BASE.length);
  return ROUTE_PATTERNS[method]?.some((pattern) => pattern.test(path)) ?? false;
}

export function toFetchHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || SKIPPED_HEADERS.has(name)) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      headers.append(name, item);
    }
  }
  return headers;
}

export function registerAuthRoutes(
  v1: FastifyInstance,
  deps: AuthRouteDependencies,
) {
  v1.route({
    method: ["GET", "POST"],
    url: "/auth/*",
    schema: { hide: true },
    async handler(request, reply) {
      if (!isAuthRoute(request.method, request.url))
        return reply.callNotFound();
      // Links in emails and OAuth callbacks come from this URL, so never trust the Host header
      const url = `${deps.publicApiUrl}${request.url}`;
      const hasBody = request.method !== "GET" && request.body !== undefined;
      const response = await deps.handleAuth(
        new Request(url, {
          method: request.method,
          headers: toFetchHeaders(request),
          body: hasBody ? JSON.stringify(request.body) : undefined,
        }),
      );

      reply.code(response.status);
      for (const [name, value] of response.headers) {
        if (name === "set-cookie" || SKIPPED_HEADERS.has(name)) continue;
        reply.header(name, value);
      }
      // Sessions and tokens pass through here, so nothing is cached unless Better Auth says so
      if (!response.headers.has("cache-control")) {
        reply.header("cache-control", "no-store");
      }
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) reply.header("set-cookie", cookies);
      return reply.send(
        response.body ? Buffer.from(await response.arrayBuffer()) : null,
      );
    },
  });
}
