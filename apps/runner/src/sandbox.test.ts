import { execFileSync } from "node:child_process";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCode } from "./run.ts";
import { LIMITS, readBoxFile, type Sandbox } from "./sandbox.ts";

let dir = "";
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "meritory-box-test-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const windows = process.platform === "win32";

describe("readBoxFile", () => {
  it("reads a plain file", async () => {
    await writeFile(join(dir, "a.txt"), "hello");
    expect(await readBoxFile(join(dir, "a.txt"), 100)).toEqual({
      text: "hello",
      cut: false,
    });
  });

  it("reads up to the cap and says it was cut", async () => {
    await writeFile(join(dir, "a.txt"), "x".repeat(20));
    expect(await readBoxFile(join(dir, "a.txt"), 10)).toEqual({
      text: "x".repeat(10),
      cut: true,
    });
    expect((await readBoxFile(join(dir, "a.txt"), 20)).cut).toBe(false);
  });

  it("reads a missing file or a folder as empty", async () => {
    const empty = { text: "", cut: false };
    expect(await readBoxFile(join(dir, "missing.txt"), 10)).toEqual(empty);
    expect(await readBoxFile(dir, 10)).toEqual(empty);
  });

  it.skipIf(windows)("doesn't follow a link", async () => {
    await writeFile(join(dir, "secret.txt"), "secret");
    await symlink(join(dir, "secret.txt"), join(dir, "stderr.txt"));
    await symlink("/dev/zero", join(dir, "zero.txt"));
    const empty = { text: "", cut: false };
    expect(await readBoxFile(join(dir, "stderr.txt"), 100)).toEqual(empty);
    expect(await readBoxFile(join(dir, "zero.txt"), 100)).toEqual(empty);
  });

  it.skipIf(windows)("doesn't wait on a pipe", async () => {
    execFileSync("mkfifo", [join(dir, "results.jsonl")]);
    expect(await readBoxFile(join(dir, "results.jsonl"), 100)).toEqual({
      text: "",
      cut: false,
    });
  });
});

describe("runCode", () => {
  it("fails a run whose results are over the file limit", async () => {
    const sandbox: Sandbox = {
      async open() {
        return {
          dir,
          async run() {
            const line = `${JSON.stringify({ name: "one", status: "started" })}\n`;
            await writeFile(
              join(dir, "results.jsonl"),
              line.repeat(Math.ceil((LIMITS.fileKb * 1024) / line.length) + 1),
            );
            return { kind: "ok", stderr: "" };
          },
          async close() {},
        };
      },
    };
    const result = await runCode(
      {
        language: "typescript",
        code: "",
        signature: { function: "f", params: [], returns: "int" },
        cases: [{ uuid: "a", description: "one", input: {}, expected: 1 }],
      },
      sandbox,
    );
    expect(result).toEqual({
      version: 3,
      status: "error",
      message: "The values it returned were too large to check.",
      tests: [],
    });
  });
});
