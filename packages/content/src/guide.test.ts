import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromMarkdown } from "mdast-util-from-markdown";
import { afterEach, describe, expect, it } from "vitest";
import { buildBundle } from "./build.ts";
import { lockTrack } from "./lock.ts";
import { formatProblem, subfolders } from "./yaml-file.ts";

const guideFile = fileURLToPath(
  new URL("../../../content/README.md", import.meta.url),
);

// Code blocks in these languages show a file, so each must name its path
const FILE_LANGUAGES = new Set([
  "yaml",
  "json",
  "markdown",
  "ts",
  "python",
  "java",
  "c",
]);

type MarkdownNode = {
  type: string;
  lang?: string | null;
  value?: string;
  position?: { start: { line: number } };
  children?: MarkdownNode[];
};

type Example = { file: string; text: string };

/** The path in a paragraph that holds only `content/...`, if it is one */
function pathIn(node: MarkdownNode | undefined): string | undefined {
  const only = node?.type === "paragraph" ? node.children : undefined;
  const code = only?.length === 1 ? only[0] : undefined;
  return code?.type === "inlineCode" && code.value?.startsWith("content/")
    ? code.value.slice("content/".length)
    : undefined;
}

/** Every file the guide shows, named by the path just above its code block */
function examplesIn(guide: string) {
  const examples: Example[] = [];
  const unnamed: string[] = [];
  const nodes = fromMarkdown(guide.replaceAll("\r\n", "\n")).children ?? [];
  nodes.forEach((node: MarkdownNode, index) => {
    if (node.type !== "code") return;
    const file = pathIn(nodes[index - 1]);
    if (file !== undefined) {
      examples.push({ file, text: `${node.value ?? ""}\n` });
    } else if (FILE_LANGUAGES.has(node.lang ?? "")) {
      unnamed.push(`${node.lang} block at line ${node.position?.start.line}`);
    }
  });
  return { examples, unnamed };
}

let contentDir: string | undefined;

afterEach(async () => {
  if (contentDir) await rm(contentDir, { recursive: true, force: true });
  contentDir = undefined;
});

/** Writes the guide's examples into a new content folder, then locks and builds it */
async function buildExamples(guide: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "meritory-guide-"));
  contentDir = dir;
  for (const { file, text } of examplesIn(guide).examples) {
    const target = path.join(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  const problems = [];
  for (const track of await subfolders(dir)) {
    problems.push(...(await lockTrack(path.join(dir, track))).problems);
  }
  const built = await buildBundle(dir);
  problems.push(...built.problems);
  return {
    bundle: built.bundle,
    lines: problems.map((problem) => formatProblem(problem, dir)),
  };
}

describe("content guide", () => {
  it("names the path of every file it shows, once", async () => {
    const { examples, unnamed } = examplesIn(await readFile(guideFile, "utf8"));
    expect(unnamed).toEqual([]);
    const files = examples.map((example) => example.file);
    expect(files.filter((file, i) => files.indexOf(file) !== i)).toEqual([]);
  });

  it("builds every example with no problems", async () => {
    const { bundle, lines } = await buildExamples(
      await readFile(guideFile, "utf8"),
    );
    expect(lines).toEqual([]);
    const chapter = bundle?.tracks[0]?.chapters[0];
    expect(bundle?.tracks.map((track) => track.id)).toEqual(["dsa"]);
    expect(chapter?.cards.map((card) => card.type).sort()).toEqual([
      "matching",
      "ordering",
      "pick-one",
      "prompt",
    ]);
    expect(chapter?.exercises.map((exercise) => exercise.kind).sort()).toEqual([
      "coding",
      "coding",
      "design",
      "design",
    ]);
  });

  it("names the file of an example the format no longer allows", async () => {
    const guide = (await readFile(guideFile, "utf8")).replaceAll("\r\n", "\n");
    const { lines } = await buildExamples(
      guide.replace(
        "title: Prefix sums\norder: 1\n",
        "title: Prefix sums\norder: 0\n",
      ),
    );
    expect(lines).toContain(
      "dsa/chapters/prefix-sums/chapter.yaml:3 order must be >= 1",
    );
  });
});
