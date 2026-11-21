import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Language } from "./run.ts";

export interface SandboxExit {
  kind: "ok" | "failed" | "timeout" | "memory" | "signal" | "sandbox";
  signal?: string;
  /** The start of what the program wrote to stderr */
  stderr: string;
}

export interface Box {
  /** Where the program's files go */
  dir: string;
  run(language: Language, file: string): Promise<SandboxExit>;
  close(): Promise<void>;
}

export interface Sandbox {
  open(): Promise<Box>;
}

/** Limits for every run, matching docs/runner.md */
export const LIMITS = {
  cpuSeconds: 5,
  wallSeconds: 10,
  memoryKb: 256 * 1024,
  processes: 16,
  fileKb: 2048,
  outputBytes: 64 * 1024,
} as const;

interface Exec {
  code: number | null;
  stdout: string;
  stderr: string;
}

function exec(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<Exec & { killed: boolean; signal: string | null }> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd: options.cwd,
        timeout: options.timeoutMs ?? 0,
        env: options.env,
        maxBuffer: LIMITS.outputBytes,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        const failure = error as
          | (Error & {
              code?: number | string;
              killed?: boolean;
              signal?: string;
            })
          | null;
        resolve({
          code:
            typeof failure?.code === "number" ? failure.code : failure ? 1 : 0,
          stdout,
          stderr,
          killed: failure?.killed ?? false,
          signal: failure?.signal ?? null,
        });
      },
    );
  });
}

const COMMANDS: Record<Language, (file: string) => string[]> = {
  typescript: (file) => ["/usr/local/bin/node", file],
  // -I ignores the environment and user site packages, -B writes no .pyc files
  python: (file) => ["/usr/bin/python3", "-I", "-B", file],
};

/** Reads Isolate's key:value meta file */
export function parseMeta(text: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at)] = line.slice(at + 1).trim();
  }
  return meta;
}

/** How a run ended, from Isolate's meta file */
export function exitFromMeta(
  meta: Record<string, string>,
  stderr: string,
): SandboxExit {
  if (meta["cg-oom-killed"] !== undefined) return { kind: "memory", stderr };
  switch (meta.status) {
    case "TO":
      return { kind: "timeout", stderr };
    case "SG":
      return { kind: "signal", signal: meta.exitsig, stderr };
    case "RE":
      return { kind: "failed", stderr };
    case "XX":
      return { kind: "sandbox", stderr: meta.message ?? stderr };
    default:
      return { kind: "ok", stderr };
  }
}

/** Isolate's boxes, one per slot, in control group mode with no network */
export function isolateSandbox(boxId: number): Sandbox {
  const base = ["--cg", `--box-id=${boxId}`];
  return {
    async open() {
      // Clears anything a crashed run left behind
      await exec("isolate", [...base, "--cleanup"]);
      const init = await exec("isolate", [...base, "--init"]);
      if (init.code !== 0) {
        throw new Error(`isolate --init failed: ${init.stderr.trim()}`);
      }
      const dir = join(init.stdout.trim(), "box");
      return {
        dir,
        async run(language, file) {
          const metaDir = await mkdtemp(join(tmpdir(), "meritory-meta-"));
          const metaFile = join(metaDir, "meta");
          try {
            await exec("isolate", [
              ...base,
              `--meta=${metaFile}`,
              `--time=${LIMITS.cpuSeconds}`,
              "--extra-time=0.5",
              `--wall-time=${LIMITS.wallSeconds}`,
              `--cg-mem=${LIMITS.memoryKb}`,
              `--processes=${LIMITS.processes}`,
              `--fsize=${LIMITS.fileKb}`,
              "--stdout=stdout.txt",
              "--stderr=stderr.txt",
              "--env=PATH=/usr/local/bin:/usr/bin:/bin",
              "--run",
              "--",
              ...COMMANDS[language](file),
            ]);
            const [meta, stderr] = await Promise.all([
              readFile(metaFile, "utf8").catch(() => "status:XX\n"),
              readFile(join(dir, "stderr.txt"), "utf8").catch(() => ""),
            ]);
            return exitFromMeta(parseMeta(meta), stderr.slice(0, 2000));
          } finally {
            await rm(metaDir, { recursive: true, force: true });
          }
        },
        async close() {
          await exec("isolate", [...base, "--cleanup"]);
        },
      };
    },
  };
}

/**
 * Runs the harness as a plain child process, with no sandbox at all. Only
 * tests use it, to check the harness against the reference solutions.
 */
export function directSandbox(timeoutMs = LIMITS.wallSeconds * 1000): Sandbox {
  const python = process.platform === "win32" ? "python" : "python3";
  return {
    async open() {
      const dir = await mkdtemp(join(tmpdir(), "meritory-run-"));
      return {
        dir,
        async run(language, file) {
          const [command, ...args] =
            language === "typescript"
              ? [process.execPath, file]
              : [python, "-I", "-B", file];
          const result = await exec(command as string, args, {
            cwd: dir,
            timeoutMs,
          });
          const stderr = result.stderr.slice(0, 2000);
          if (result.killed) return { kind: "timeout", stderr };
          if (result.signal)
            return { kind: "signal", signal: result.signal, stderr };
          return { kind: result.code === 0 ? "ok" : "failed", stderr };
        },
        async close() {
          await rm(dir, { recursive: true, force: true });
        },
      };
    },
  };
}
