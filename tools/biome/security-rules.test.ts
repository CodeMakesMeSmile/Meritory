import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const biome = createRequire(import.meta.url).resolve(
  "@biomejs/biome/bin/biome",
);

// Code that must fail the build, and the check that has to catch it
const UNSAFE = {
  "inner-html.tsx": {
    check: "lint/security/noDangerouslySetInnerHtml",
    code: "export const A = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />;",
  },
  "script-url.tsx": {
    check: "lint/security/noScriptUrl",
    code: 'export const A = () => <a href="javascript:void(0)">Open</a>;',
  },
  "blank-target.tsx": {
    check: "lint/security/noBlankTarget",
    code: 'export const A = ({ url }: { url: string }) => <a href={url} target="_blank">Open</a>;',
  },
  "eval.ts": {
    check: "lint/security/noGlobalEval",
    code: "export const run = (code: string) => eval(code);",
  },
  "implied-eval.ts": {
    check: "lint/nursery/noImpliedEval",
    code: 'export const run = () => setTimeout("alert(1)", 1);',
  },
  "cookie.ts": {
    check: "lint/suspicious/noDocumentCookie",
    code: 'export const set = () => { document.cookie = "a=b"; };',
  },
  "secret.ts": {
    check: "lint/security/noSecrets",
    code: 'export const key = "AKIAIOSFODNN7EXAMPLE";',
  },
  "sql-raw.ts": {
    check: "plugin",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source code for the probe file
    code: 'import { sql } from "drizzle-orm";\nexport const q = (id: string) => sql.raw(`select * from users where id = ${id}`);',
  },
  "sql-unsafe.ts": {
    check: "plugin",
    code: "export const q = (db: { unsafe(s: string): unknown }, s: string) => db.unsafe(s);",
  },
} as const;

// The safe way to do the same things, which must stay quiet
const SAFE = {
  "safe.tsx": [
    'import { sql } from "drizzle-orm";',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source code for the probe file
    "export const q = (id: string) => sql`select * from users where id = ${id}`;",
    "export const A = ({ name }: { name: string }) => <p>{name}</p>;",
    'export const B = ({ url }: { url: string }) => <a href={url} target="_blank" rel="noopener">Open</a>;',
  ].join("\n"),
};

interface Diagnostic {
  category: string;
  location: { path: string };
}

let dir = "";
let found: Diagnostic[] = [];

beforeAll(() => {
  // Inside the repo, so the project's biome.json applies
  dir = mkdtempSync(join(import.meta.dirname, "probe-"));
  for (const [name, { code }] of Object.entries(UNSAFE)) {
    writeFileSync(join(dir, name), `${code}\n`);
  }
  for (const [name, code] of Object.entries(SAFE)) {
    writeFileSync(join(dir, name), `${code}\n`);
  }
  const run = spawnSync(
    process.execPath,
    [biome, "lint", relative(process.cwd(), dir), "--reporter=json"],
    { encoding: "utf8" },
  );
  found = JSON.parse(run.stdout).diagnostics;
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const checksFor = (name: string) =>
  found
    .filter((d) => d.location.path.replaceAll("\\", "/").endsWith(`/${name}`))
    .map((d) => d.category);

describe("security lint rules", () => {
  it.each(Object.entries(UNSAFE))(
    "%s fails with its check",
    (name, { check }) => {
      expect(checksFor(name)).toContain(check);
    },
  );

  it("leaves the safe versions alone", () => {
    expect(checksFor("safe.tsx")).toEqual([]);
  });
});
