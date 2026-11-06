import { type ErrorResponse, MeResponse } from "@meritory/contracts";
import type { FastifyInstance } from "fastify";
import { toFetchHeaders } from "./auth-routes.ts";

declare module "fastify" {
  interface FastifyRequest {
    /** Always set inside the signed-in scope, and null outside it */
    user: MeResponse | null;
  }
}

export interface SessionDependencies {
  /** The signed-in user for these request headers, or null */
  currentUser(headers: Headers): Promise<MeResponse | null>;
}

/** Routes that need a session. Everything else stays public. */
export async function registerSignedInRoutes(
  v1: FastifyInstance,
  deps: SessionDependencies,
) {
  await v1.register(async (scope) => {
    scope.decorateRequest("user", null);

    scope.addHook("onRequest", async (request, reply) => {
      const user = await deps.currentUser(toFetchHeaders(request));
      if (!user) {
        return reply.code(401).send({
          code: "unauthorized",
          message: "Sign in to continue.",
        } satisfies ErrorResponse);
      }
      request.user = user;
    });

    scope.get(
      "/me",
      {
        schema: {
          summary: "The signed-in user",
          tags: ["account"],
          response: { 200: MeResponse },
        },
      },
      async (request) => request.user,
    );
  });
}
