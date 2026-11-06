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
