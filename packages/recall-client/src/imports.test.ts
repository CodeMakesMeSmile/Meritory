import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const SRC = new URL("./", import.meta.url);

describe("recall client", () => {
  it("imports nothing the phone can't load", async () => {
    const files = (await readdir(SRC)).filter(
      (name) => name.endsWith(".ts") && !name.endsWith(".test.ts"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const text = await readFile(new URL(name, SRC), "utf8");
      const sources = [...text.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
      for (const source of sources) {
        const allowed =
          source?.startsWith("./") || source?.startsWith("@meritory/contracts");
        expect(allowed, `${name} imports ${source}`).toBe(true);
      }
    }
  });
});
