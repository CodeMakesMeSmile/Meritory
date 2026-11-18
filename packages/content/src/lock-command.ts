import path from "node:path";
import { fileURLToPath } from "node:url";
import { NOT_TRACKS } from "./build.ts";
import { lockTrack, type Written } from "./lock.ts";
import { formatProblem, subfolders } from "./yaml-file.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const contentDir = path.join(root, "content");

let added = 0;
let failed = false;
const report = (written: Written[], what: [string, string], verb: string) => {
  for (const { file, added: count } of written) {
    const where = path.relative(root, file).replaceAll(path.sep, "/");
    const noun = count === 1 ? what[0] : what[1];
    console.log(`${verb} ${count} new ${noun} in ${where}`);
    added += count;
  }
};
for (const track of await subfolders(contentDir)) {
  if (NOT_TRACKS.has(track)) continue;
  const result = await lockTrack(path.join(contentDir, track));
  report(result.written, ["case", "cases"], "Locked");
  report(result.versions, ["version", "versions"], "Recorded");
  for (const problem of result.problems) {
    console.error(`${formatProblem(problem, root)}, so it was left as it is`);
    failed = true;
  }
}
if (failed) {
  console.error("Run pnpm content:build to see every problem");
} else if (added === 0) {
  console.log("Every case and version is already recorded");
}
process.exitCode = failed ? 1 : 0;
