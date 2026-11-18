import path from "node:path";
import { fileURLToPath } from "node:url";
import { lockTrack } from "./lock.ts";
import { formatProblem, subfolders } from "./yaml-file.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const contentDir = path.join(root, "content");

let added = 0;
let failed = false;
for (const track of await subfolders(contentDir)) {
  const result = await lockTrack(path.join(contentDir, track));
  for (const { file, added: count } of result.written) {
    const where = path.relative(root, file).replaceAll(path.sep, "/");
    console.log(
      `Locked ${count} new ${count === 1 ? "case" : "cases"} in ${where}`,
    );
    added += count;
  }
  for (const problem of result.problems) {
    console.error(`${formatProblem(problem, root)}, so it was left as it is`);
    failed = true;
  }
}
if (added === 0 && !failed) console.log("Every case is already locked");
process.exitCode = failed ? 1 : 0;
