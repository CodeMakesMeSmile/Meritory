import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBundle } from "./build.ts";
import { canonicalJson } from "./values.ts";
import { formatProblem } from "./yaml-file.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = path.join(root, "packages", "content", "dist", "bundle.json");

const { bundle, problems } = await buildBundle(path.join(root, "content"));
if (!bundle) {
  for (const problem of problems) console.error(formatProblem(problem, root));
  const count = `${problems.length} ${problems.length === 1 ? "problem" : "problems"}`;
  console.error(`Found ${count}, so no bundle was written`);
  process.exitCode = 1;
} else {
  await mkdir(path.dirname(output), { recursive: true });
  // Canonical JSON, so the same content always writes the same bytes
  await writeFile(output, `${canonicalJson(bundle)}\n`);
  const where = path.relative(root, output).replaceAll(path.sep, "/");
  console.log(`Built ${where} with hash ${bundle.hash}`);
}
