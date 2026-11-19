import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { canonicalJson } from "@meritory/content";
import { ContentResponse } from "@meritory/contracts";
import type { FastifyInstance } from "fastify";
import Type from "typebox";
import Value from "typebox/value";

/** The built bundle, kept as the exact text that's sent */
export interface ServedContent {
  /** The hash over every track, which is also the ETag */
  hash: string;
  text: string;
}

const REBUILD = "Build it again with pnpm content:build.";

/** How many schema errors to print, since one bad item can cause many */
const SHOWN_ERRORS = 5;

/** Reads the built bundle and refuses one that's missing, malformed, or edited */
export async function loadContent(file: string): Promise<ServedContent> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `No content bundle at ${file}. Build it with pnpm content:build.`,
      );
    }
    throw error;
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `The content bundle at ${file} isn't valid JSON. ${REBUILD}`,
    );
  }

  if (!Value.Check(ContentResponse, data)) {
    const errors = [...Value.Errors(ContentResponse, data)]
      .slice(0, SHOWN_ERRORS)
      .map((error) => `  ${error.instancePath || "/"} ${error.message}`);
    throw new Error(
      `The content bundle at ${file} doesn't fit its schema. ${REBUILD}\n${errors.join("\n")}`,
    );
  }

  // The same hash the build makes, so an edited or stale file is caught
  const hash = createHash("sha256")
    .update(canonicalJson(data.tracks))
    .digest("hex");
  if (hash !== data.hash) {
    throw new Error(
      `The content bundle at ${file} doesn't match its hash. ${REBUILD}`,
    );
  }
  return { hash, text };
}

const ENTITY_TAG = /(?:W\/)?"([^"]*)"/g;

/** Whether If-None-Match names this tag, by weak comparison as RFC 9110 asks */
export function ifNoneMatchHits(
  header: string | string[] | undefined,
  tag: string,
): boolean {
  if (header === undefined) return false;
  const value = Array.isArray(header) ? header.join(",") : header;
  if (value.trim() === "*") return true;
  for (const match of value.matchAll(ENTITY_TAG)) {
    if (match[1] === tag) return true;
  }
  return false;
}

/** Only for the signed-in scope, since the curriculum isn't public */
export function registerContentRoutes(
  scope: FastifyInstance,
  content: ServedContent,
) {
  scope.get(
    "/content",
    {
      schema: {
        summary: "Every track's chapters, cards, exercises, and rubrics",
        tags: ["content"],
        response: {
          200: ContentResponse,
          304: Type.Null({ description: "Unchanged since that ETag" }),
        },
      },
    },
    async (request, reply) => {
      reply
        .header("etag", `"${content.hash}"`)
        .header("cache-control", "private, no-cache");
      if (ifNoneMatchHits(request.headers["if-none-match"], content.hash)) {
        return reply.code(304).send();
      }
      // Strings are sent unmodified, so the bundle is never serialized again
      return reply.type("application/json; charset=utf-8").send(content.text);
    },
  );
}
