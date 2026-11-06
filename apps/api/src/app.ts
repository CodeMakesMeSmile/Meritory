import swagger from "@fastify/swagger";
import {
  type TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import {
  API_PREFIX,
  type ErrorResponse,
  LiveResponse,
  ReadyResponse,
} from "@meritory/contracts";
import Fastify, { type FastifyError, type FastifyServerOptions } from "fastify";
import {
  type AuthRouteDependencies,
  registerAuthRoutes,
} from "./auth-routes.ts";
import { registerSignedInRoutes, type SessionDependencies } from "./session.ts";

/** Our own codes, so clients never see framework internals */
const CODES_BY_STATUS: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  413: "payload_too_large",
  415: "unsupported_media_type",
  429: "rate_limited",
};

function errorCode(error: FastifyError, status: number): string {
  if (status >= 500) return "internal_error";
  if (error.validation) return "validation_failed";
  return CODES_BY_STATUS[status] ?? "bad_request";
}

export interface AppDependencies
  extends AuthRouteDependencies,
    SessionDependencies {
  /** Resolves true when the database answers */
  pingDatabase(): Promise<boolean>;
}

export async function buildApp(
  deps: AppDependencies,
  options: FastifyServerOptions = {},
) {
  const app = Fastify(options)
    .setValidatorCompiler(TypeBoxValidatorCompiler)
    .withTypeProvider<TypeBoxTypeProvider>();

  await app.register(swagger, {
    openapi: {
      info: { title: "Meritory API", version: "1" },
    },
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      code: "not_found",
      message: `No route for ${request.method} ${request.url}`,
    } satisfies ErrorResponse);
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const status =
      typeof error.statusCode === "number" && error.statusCode >= 400
        ? error.statusCode
        : 500;
    if (status >= 500) request.log.error(error);
    reply.code(status).send({
      code: errorCode(error, status),
      message: status >= 500 ? "Something went wrong." : error.message,
    } satisfies ErrorResponse);
  });

  await app.register(
    async (v1) => {
      v1.get(
        "/health/live",
        {
          schema: {
            summary: "The process is up",
            tags: ["operations"],
            response: { 200: LiveResponse },
          },
        },
        async () => ({ status: "ok" as const }),
      );

      v1.get(
        "/health/ready",
        {
          schema: {
            summary: "The process can serve traffic",
            tags: ["operations"],
            response: { 200: ReadyResponse, 503: ReadyResponse },
          },
        },
        async (_request, reply) => {
          const database = (await deps.pingDatabase()) ? "ok" : "down";
          const status = database === "ok" ? "ok" : "down";
          return reply
            .code(status === "ok" ? 200 : 503)
            .send({ status, checks: { database } });
        },
      );

      v1.get("/openapi.json", { schema: { hide: true } }, async () =>
        app.swagger(),
      );

      registerAuthRoutes(v1, deps);
      await registerSignedInRoutes(v1, deps);
    },
    { prefix: API_PREFIX },
  );

  return app;
}
