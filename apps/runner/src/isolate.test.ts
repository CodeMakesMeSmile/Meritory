/**
 * Runs answers in real Isolate boxes, so the limits in docs/runner.md are
 * checked end to end. Needs Linux with Isolate set up as that page says, so
 * it only runs with ISOLATE_TESTS=1.
 */
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BundleCodingExercise } from "@meritory/content";
import { buildBundle } from "@meritory/content/node";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BundleCase,
  type Language,
  type RunResult,
  runCode,
} from "./run.ts";
import { isolateSandbox, LIMITS } from "./sandbox.ts";

/** Far above the runner's own slots, which start at 0 */
const BOX = 999;
const CONTENT = fileURLToPath(new URL("../../../content/", import.meta.url));
const EXERCISE = `${CONTENT}dsa/chapters/arrays-and-hashing/exercises/price-pair/`;
const CASE_MS = (LIMITS.wallSeconds + 10) * 1000;

let exercise: BundleCodingExercise;
let secretDir = "";
let secretFile = "";
let secret = "";

beforeAll(async () => {
  if (process.env.ISOLATE_TESTS !== "1") return;
  const { bundle } = await buildBundle(CONTENT);
  const found = bundle?.tracks
    .flatMap((t) => t.chapters.flatMap((c) => c.exercises))
    .find(
      (e): e is BundleCodingExercise =>
        e.kind === "coding" && e.id === "price-pair",
    );
  if (!found) throw new Error("price-pair is missing");
  exercise = found;
  secretDir = await mkdtemp(join(tmpdir(), "meritory-isolate-test-"));
  secretFile = join(secretDir, "secret.txt");
  secret = randomBytes(16).toString("hex");
  await writeFile(secretFile, secret);
}, 60000);

afterAll(async () => {
  if (secretDir) await rm(secretDir, { recursive: true, force: true });
});

async function run(language: Language, code: string) {
  const started = Date.now();
  const result = await runCode(
    {
      language,
      code,
      signature: exercise.signature as Record<string, unknown>,
      cases: exercise.cases as BundleCase[],
    },
    isolateSandbox(BOX),
  );
  return { result, ms: Date.now() - started };
}

/** The first case's message, for answers that hand back what they saw */
const firstMessage = (result: RunResult) => result.tests[0]?.message ?? "";

const TS_HEAD = "export function pricePair(prices: number[], target: number) {";
const PY_HEAD = "class Solution:\n    def pricePair(self, prices, target):\n";
const py = (...lines: string[]) =>
  `import os, socket\n${PY_HEAD}${lines.map((l) => `        ${l}`).join("\n")}\n`;

describe.skipIf(process.env.ISOLATE_TESTS !== "1")("Isolate sandbox", () => {
  it.each(["typescript", "python"] as const)(
    "passes the %s reference solution",
    async (language) => {
      const file = language === "typescript" ? "solution.ts" : "solution.py";
      const code = await readFile(`${EXERCISE}solutions/${file}`, "utf8");
      const { result } = await run(language, code);
      expect(result.status).toBe("pass");
    },
    CASE_MS,
  );

  it.each([
    ["typescript", `${TS_HEAD} for (;;) {} }`],
    ["python", py("while True:", "    pass")],
  ] as const)(
    "stops a %s loop that never ends",
    async (language, code) => {
      const { result } = await run(language, code);
      expect(result.status).toBe("error");
      expect(firstMessage(result)).toMatch(/^Took too long/);
    },
    CASE_MS,
  );

  it.each([
    [
      "typescript",
      `${TS_HEAD} const kept: Buffer[] = []; for (;;) kept.push(Buffer.alloc(32 * 1024 * 1024, 1)); }`,
    ],
    [
      "python",
      py(
        "kept = []",
        "while True:",
        '    kept.append(b"x" * (32 * 1024 * 1024))',
      ),
    ],
  ] as const)(
    "stops %s using far more memory than allowed",
    async (language, code) => {
      const { result } = await run(language, code);
      expect(result.status).toBe("error");
      expect(firstMessage(result)).toBe(
        "Used too much memory, so it was stopped.",
      );
    },
    CASE_MS,
  );

  it.each([
    [
      "typescript",
      [
        'import { spawn } from "node:child_process";',
        TS_HEAD,
        "  for (let i = 0; i < 1000; i++) {",
        '    const child = spawn("/bin/sleep", ["60"], { stdio: "ignore" });',
        '    child.on("error", () => {});',
        "    child.unref();",
        '    if (child.pid === undefined) return "capped";',
        "  }",
        '  return "spawned";',
        "}",
      ].join("\n"),
    ],
    [
      "python",
      py(
        "try:",
        "    for _ in range(1000):",
        "        if os.fork() == 0:",
        "            os.execv('/bin/sleep', ['sleep', '60'])",
        "except OSError:",
        "    return 'capped'",
        "return 'forked'",
      ),
    ],
  ] as const)(
    "caps %s starting too many processes",
    async (language, code) => {
      const { result, ms } = await run(language, code);
      expect(firstMessage(result)).toMatch(/but got "capped"$/);
      expect(ms).toBeLessThan(LIMITS.wallSeconds * 1000);
    },
    CASE_MS,
  );

  it(
    "has no network",
    async () => {
      const code = py(
        "try:",
        "    socket.create_connection(('1.1.1.1', 53), timeout=2)",
        "    return 'connected'",
        "except OSError:",
        "    return 'offline'",
      );
      const { result } = await run("python", code);
      expect(firstMessage(result)).toMatch(/but got "offline"$/);
    },
    CASE_MS,
  );

  it.each([
    [
      "typescript",
      [
        'import { writeFileSync } from "node:fs";',
        TS_HEAD,
        "  try {",
        `    writeFileSync("big.bin", Buffer.alloc(${LIMITS.fileKb + 1024} * 1024));`,
        '    return "wrote";',
        "  } catch {",
        '    return "capped";',
        "  }",
        "}",
      ].join("\n"),
    ],
    [
      "python",
      py(
        "try:",
        "    with open('big.bin', 'wb') as f:",
        `        f.write(b'x' * (${LIMITS.fileKb + 1024} * 1024))`,
        "    return 'wrote'",
        "except OSError:",
        "    return 'capped'",
      ),
    ],
  ] as const)(
    "caps the size of a file %s writes",
    async (language, code) => {
      const { result } = await run(language, code);
      expect(firstMessage(result)).toMatch(/but got "capped"$/);
    },
    CASE_MS,
  );

  it.each([
    [
      "typescript",
      [
        'import { readFileSync } from "node:fs";',
        `${TS_HEAD} try { return readFileSync("/etc/hostname", "utf8"); } catch { return "hidden"; } }`,
      ].join("\n"),
    ],
    [
      "python",
      py(
        "try:",
        "    with open('/etc/hostname') as f:",
        "        return f.read()",
        "except OSError:",
        "    return 'hidden'",
      ),
    ],
  ] as const)(
    "keeps the host's files from %s",
    async (language, code) => {
      const { result } = await run(language, code);
      expect(firstMessage(result)).toMatch(/but got "hidden"$/);
    },
    CASE_MS,
  );

  // Each answer swaps the files the runner reads for something else, then quits
  const swaps = (make: string) =>
    [
      "import os",
      "for name in ('stderr.txt', 'results.jsonl'):",
      "    if os.path.lexists(name):",
      "        os.remove(name)",
      `    ${make}`,
      "os._exit(1)",
    ].join("\n");
  const tsSwaps = (target: string) =>
    [
      'import { rmSync, symlinkSync } from "node:fs";',
      'for (const name of ["stderr.txt", "results.jsonl"]) {',
      "  rmSync(name, { force: true });",
      `  symlinkSync(${JSON.stringify(target)}, name);`,
      "}",
      "process.exit(1);",
      "export function pricePair() { return []; }",
    ].join("\n");

  it.each([
    [
      "python",
      "a link to a host file",
      () => swaps(`os.symlink(${JSON.stringify(secretFile)}, name)`),
    ],
    ["python", "a pipe", () => swaps("os.mkfifo(name)")],
    [
      "python",
      "a link to /dev/zero",
      () => swaps("os.symlink('/dev/zero', name)"),
    ],
    ["typescript", "a link to a host file", () => tsSwaps(secretFile)],
    ["typescript", "a link to /dev/zero", () => tsSwaps("/dev/zero")],
  ] as const)(
    "ignores %s output files replaced with %s",
    async (language, _, code) => {
      const { result, ms } = await run(language, code());
      expect(["fail", "error"]).toContain(result.status);
      expect(JSON.stringify(result)).not.toContain(secret);
      expect(ms).toBeLessThan(LIMITS.wallSeconds * 1000);
    },
    CASE_MS,
  );
});
