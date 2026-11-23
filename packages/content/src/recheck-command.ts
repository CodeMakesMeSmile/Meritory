import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRecheck } from "./report.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runRecheck({
  contentDir: path.join(root, "content"),
  strict: process.argv.includes("--strict"),
  root,
  github: process.env.GITHUB_ACTIONS === "true",
  summaryFile: process.env.GITHUB_STEP_SUMMARY,
});
