import { createHash, timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import {
  type BundleCase,
  LANGUAGES,
  type Language,
  type RunRequest,
  type RunResult,
} from "./run.ts";

/** Code longer than this is refused before it reaches a box */
export const MAX_CODE_BYTES = 64 * 1024;
const MAX_BODY_BYTES = 1024 * 1024;
const NAME = /^[A-Za-z][A-Za-z0-9]{0,39}$/;

export interface RunnerOptions {
  token: string;
  /** How many runs go at once, one box each */
  slots: number;
  /** How many more can wait for a slot before the runner says it's busy */
  waiting: number;
  run(request: RunRequest, slot: number): Promise<RunResult>;
}

const digest = (text: string) => createHash("sha256").update(text).digest();

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** The request's shape, or why it's refused */
export function parseRequest(body: unknown): RunRequest | string {
  if (typeof body !== "object" || body === null)
    return "The body isn't an object.";
  const { language, code, signature, cases } = body as Record<string, unknown>;
  if (!LANGUAGES.includes(language as Language)) return "Unknown language.";
  if (typeof code !== "string") return "The code is missing.";
  if (Buffer.byteLength(code) > MAX_CODE_BYTES)
    return "The code is over 64 KB.";
  if (typeof signature !== "object" || signature === null)
    return "The signature is missing.";
  const name =
    (signature as Record<string, unknown>).function ??
    (signature as Record<string, unknown>).class;
  if (typeof name !== "string" || !NAME.test(name))
    return "The signature has no valid name.";
  if (!Array.isArray(cases) || cases.length === 0 || cases.length > 500) {
    return "The cases are missing.";
  }
  const valid = cases.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as BundleCase).uuid === "string" &&
      typeof (c as BundleCase).description === "string" &&
      typeof (c as BundleCase).input === "object",
  );
  if (!valid) return "A case is malformed.";
  return {
    language: language as Language,
    code,
    signature: signature as Record<string, unknown>,
    cases: cases as BundleCase[],
  };
}

/** Hands out box numbers, and keeps a short line of runs waiting for one */
export function slotPool(slots: number, waiting: number) {
  const free = Array.from({ length: slots }, (_, i) => i);
  const queue: ((slot: number) => void)[] = [];
  return {
    take(): Promise<number> | null {
      const slot = free.shift();
      if (slot !== undefined) return Promise.resolve(slot);
      if (queue.length >= waiting) return null;
      return new Promise((resolve) => queue.push(resolve));
    },
    give(slot: number) {
      const next = queue.shift();
      if (next) next(slot);
      else free.push(slot);
    },
  };
}

export function createRunnerServer(options: RunnerOptions): Server {
  const expected = digest(options.token);
  const pool = slotPool(options.slots, options.waiting);

  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }
    if (req.method !== "POST" || req.url !== "/runs") {
      send(res, 404, { code: "not_found" });
      return;
    }
    const header = req.headers.authorization ?? "";
    const given = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!timingSafeEqual(digest(given), expected)) {
      send(res, 401, { code: "unauthorized" });
      return;
    }
    const body = await readBody(req).catch(() => null);
    if (body === null) {
      send(res, 413, { code: "too_large" });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      send(res, 400, { code: "bad_request", message: "The body isn't JSON." });
      return;
    }
    const request = parseRequest(parsed);
    if (typeof request === "string") {
      send(res, 400, { code: "bad_request", message: request });
      return;
    }
    const taking = pool.take();
    if (!taking) {
      send(res, 429, { code: "runner_busy" });
      return;
    }
    const slot = await taking;
    try {
      send(res, 200, await options.run(request, slot));
    } catch (error) {
      console.error(error);
      send(res, 500, { code: "runner_failed" });
    } finally {
      pool.give(slot);
    }
  });
}
