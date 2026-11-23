import type { FastifyRequest, FastifyServerOptions } from "fastify";

/** The path alone, since query strings and reset paths carry sign-in tokens */
export function loggedUrl(url: string): string {
  const path = url.split(/[?#]/, 1)[0] ?? "";
  return path.replace(/(\/reset-password\/)[^/]+/, "$1[token]");
}

export function loggerOptions(
  level: string,
  stream?: { write(line: string): void },
): FastifyServerOptions["logger"] {
  return {
    level,
    stream,
    serializers: {
      req: (request: FastifyRequest) => ({
        method: request.method,
        url: loggedUrl(request.url),
        host: request.host,
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort,
      }),
    },
  };
}
