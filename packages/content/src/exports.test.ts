import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

// Imports and re-exports that stay in the built code, so not `import type`
const STATEMENT =
  /^\s*(import|export)(?!\s+type\s)[^;]*?\bfrom\s+"([^"]+)"|^\s*import\s+"([^"]+)"/gm;

/** Every module a file loads at run time, following its relative imports */
async function runtimeImports(entry: string): Promise<Set<string>> {
  const seen = new Set<string>();
  const found = new Set<string>();
  const visit = async (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(STATEMENT)) {
      const specifier = match[2] ?? match[3] ?? "";
      if (specifier.startsWith(".")) {
        await visit(path.join(path.dirname(file), specifier));
      } else {
        found.add(specifier);
      }
    }
  };
  await visit(entry);
  return found;
}

describe("package exports", () => {
  it("keeps Node modules out of the main export the phone shares", async () => {
    const imports = await runtimeImports(path.join(srcDir, "index.ts"));
    expect([...imports].filter((name) => name.startsWith("node:"))).toEqual([]);
    expect([...imports].sort()).toEqual(["typebox"]);
  });

  it("finds the Node modules the node export uses", async () => {
    const imports = await runtimeImports(path.join(srcDir, "node.ts"));
    expect(imports).toContain("node:path");
    expect(imports).toContain("node:crypto");
  });
});
