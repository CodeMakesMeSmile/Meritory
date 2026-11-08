import {
  ConfirmPasswordBody,
  EndOthersResponse,
  type ErrorResponse,
  MeResponse,
  SESSION_ERRORS,
  SessionParams,
  SessionsResponse,
  type SignedInUser,
  type SignInMethods,
} from "@meritory/contracts";
import type { FastifyInstance, FastifyReply } from "fastify";
import { toFetchHeaders } from "./auth-routes.ts";

export interface CurrentSession {
  user: SignedInUser;
  sessionId: string;
  /** Signed in, or typed the password, within the last day */
  fresh: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    /** Always set inside the signed-in scope, and null outside it */
    user: SignedInUser | null;
    current: CurrentSession | null;
  }
}

export interface AccountSessionStore {
  list(
    userId: string,
  ): Promise<
    { id: string; device: string; signedInAt: Date; lastActiveAt: Date }[]
  >;
  /** False when the session is gone or belongs to someone else */
  end(userId: string, sessionId: string): Promise<boolean>;
  endOthers(userId: string, keepId: string): Promise<number>;
  /** Whether the account has a password, and which providers sign it in */
  signInMethods(userId: string): Promise<SignInMethods>;
  confirmPassword(input: {
    userId: string;
    sessionId: string;
    password: string;
    headers: Headers;
  }): Promise<
    | { ok: true }
    | { ok: false; reason: "wrong_password" }
    | { ok: false; reason: "rate_limited"; retryAfter: number }
  >;
}

export interface SessionDependencies {
  /** The signed-in session for these request headers, or null */
  currentSession(headers: Headers): Promise<CurrentSession | null>;
  accountSessions: AccountSessionStore;
  /** The only site allowed to send changes */
  webOrigin: string;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SAME_SITE = new Set(["same-origin", "none"]);

function refuse(reply: FastifyReply, status: number, body: ErrorResponse) {
  return reply.code(status).send(body);
}

/** Routes that need a session. Everything else stays public. */
export async function registerSignedInRoutes(
  v1: FastifyInstance,
  deps: SessionDependencies,
) {
  await v1.register(async (scope) => {
    scope.decorateRequest("user", null);
    scope.decorateRequest("current", null);

    // Everything here is personal, so no cache may keep a copy
    scope.addHook("onSend", async (_request, reply, payload) => {
      reply.header("cache-control", "no-store");
      return payload;
    });

    // Browsers always send these on changes. The phone app sends neither.
    scope.addHook("onRequest", async (request, reply) => {
      if (SAFE_METHODS.has(request.method)) return;
      const origin = request.headers.origin;
      const site = request.headers["sec-fetch-site"];
      if (
        (origin !== undefined && origin !== deps.webOrigin) ||
        (site !== undefined && !SAME_SITE.has(site))
      ) {
        return refuse(reply, 403, {
          code: "forbidden",
          message: "Changes can only come from Meritory.",
        });
      }
    });

    scope.addHook("onRequest", async (request, reply) => {
      const current = await deps.currentSession(toFetchHeaders(request));
      if (!current) {
        return refuse(reply, 401, {
          code: "unauthorized",
          message: "Sign in to continue.",
        });
      }
      request.current = current;
      request.user = current.user;
    });

    const needsConfirm = (reply: FastifyReply) =>
      refuse(reply, 403, {
        code: SESSION_ERRORS.confirmPassword,
        message: "Enter your password to keep going.",
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
      async (request) => {
        const { user } = request.current as CurrentSession;
        return {
          ...user,
          signInMethods: await deps.accountSessions.signInMethods(user.id),
        };
      },
    );

    scope.get(
      "/me/sessions",
      {
        schema: {
          summary: "Where the signed-in user is signed in",
          tags: ["account"],
          response: { 200: SessionsResponse },
        },
      },
      async (request) => {
        const { user, sessionId } = request.current as CurrentSession;
        const sessions = (await deps.accountSessions.list(user.id))
          .map((session) => ({
            id: session.id,
            device: session.device,
            signedInAt: session.signedInAt.toISOString(),
            lastActiveAt: session.lastActiveAt.toISOString(),
            current: session.id === sessionId,
          }))
          // This device first, then the most recently active
          .sort((a, b) => Number(b.current) - Number(a.current));
        return { sessions };
      },
    );

    scope.delete<{ Params: SessionParams }>(
      "/me/sessions/:id",
      {
        schema: {
          summary: "Sign out one other session",
          tags: ["account"],
          params: SessionParams,
        },
      },
      async (request, reply) => {
        const { user, sessionId, fresh } = request.current as CurrentSession;
        if (!fresh) return needsConfirm(reply);
        if (request.params.id === sessionId) {
          return refuse(reply, 400, {
            code: SESSION_ERRORS.currentSession,
            message: "Use Sign out to end this session.",
          });
        }
        // Someone else's session answers the same as one that's gone
        if (!(await deps.accountSessions.end(user.id, request.params.id))) {
          return refuse(reply, 404, {
            code: "not_found",
            message: "That session already ended.",
          });
        }
        return reply.code(204).send();
      },
    );

    scope.post(
      "/me/sessions/end-others",
      {
        schema: {
          summary: "Sign out every session except this one",
          tags: ["account"],
          response: { 200: EndOthersResponse },
        },
      },
      async (request, reply) => {
        const { user, sessionId, fresh } = request.current as CurrentSession;
        if (!fresh) return needsConfirm(reply);
        const ended = await deps.accountSessions.endOthers(user.id, sessionId);
        return { ended };
      },
    );

    scope.post<{ Body: ConfirmPasswordBody }>(
      "/me/confirm-password",
      {
        schema: {
          summary: "Type the password again before ending sessions",
          tags: ["account"],
          body: ConfirmPasswordBody,
        },
      },
      async (request, reply) => {
        const { user, sessionId } = request.current as CurrentSession;
        const result = await deps.accountSessions.confirmPassword({
          userId: user.id,
          sessionId,
          password: request.body.password,
          headers: toFetchHeaders(request),
        });
        if (result.ok) return reply.code(204).send();
        if (result.reason === "rate_limited") {
          reply.header("retry-after", String(result.retryAfter));
          return refuse(reply, 429, {
            code: "rate_limited",
            message: "Too many tries.",
          });
        }
        return refuse(reply, 400, {
          code: SESSION_ERRORS.wrongPassword,
          message: "That isn't your password.",
        });
      },
    );
  });
}
