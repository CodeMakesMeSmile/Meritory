import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HTML_ATTACKS, URL_ATTACKS } from "@meritory/security-testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTrackChapters } from "./chapters.ts";
import { formatProblem } from "./yaml-file.ts";

const TRACK = `id: dsa
title: Data structures and algorithms
`;

function chapter(id: string, order: number, extra = "") {
  return `id: ${id}
title: Chapter ${order}
order: ${order}
skills:
  - id: ${id}-skill
    name: A skill
${extra}`;
}

const EXPLANATION = "# Arrays\n\nAn array keeps items next to each other.\n";

/** One card that asks why, so the chapter's skill is covered */
function cards(id: string) {
  return `- id: ${id}-card
  skill: ${id}-skill
  asks: why
  type: prompt
  prompt: Why is reading by index fast?
  reworded: What makes reading by index quick?
  points:
    - The address is worked out from the index.
  lesson:
    title: Reading by index
    explanation: The address is the start plus the index times the item size.
`;
}

let root: string;
let track: string;

async function write(name: string, text: string) {
  const file = path.join(track, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

async function writeChapter(id: string, order: number, extra = "") {
  await write(`chapters/${id}/chapter.yaml`, chapter(id, order, extra));
  await write(`chapters/${id}/explanation.md`, EXPLANATION);
  await write(`chapters/${id}/cards.yaml`, cards(id));
}

async function problemLines() {
  const { problems } = await loadTrackChapters(track);
  return problems.map((problem) => formatProblem(problem, track));
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "meritory-chapters-"));
  track = path.join(root, "dsa");
  await mkdir(track);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("loadTrackChapters", () => {
  it("loads chapters in order with their explanations", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("hashing", 2, "prerequisites:\n  - arrays\n");
    await writeChapter("arrays", 1);

    const {
      track: loaded,
      chapters,
      problems,
    } = await loadTrackChapters(track);

    expect(problems).toEqual([]);
    expect(loaded).toEqual({
      id: "dsa",
      title: "Data structures and algorithms",
    });
    expect(chapters.map((c) => [c.id, c.order, c.track])).toEqual([
      ["arrays", 1, "dsa"],
      ["hashing", 2, "dsa"],
    ]);
    expect(chapters[0]?.explanation).toBe(EXPLANATION);
  });

  it("has nothing to check when a track has no chapters", async () => {
    expect(await loadTrackChapters(track)).toEqual({
      track: undefined,
      chapters: [],
      rubrics: [],
      problems: [],
    });
  });

  it("reports a missing track file", async () => {
    await writeChapter("arrays", 1);
    expect(await problemLines()).toEqual([
      "track.yaml is missing, so the chapters have no track",
    ]);
  });

  it("reports a track id that doesn't match its folder", async () => {
    await write("track.yaml", "id: algorithms\ntitle: Algorithms\n");
    await writeChapter("arrays", 1);
    expect(await problemLines()).toEqual([
      "track.yaml:1 id algorithms must match its folder name, dsa",
    ]);
  });

  it("reports a missing field with its line", async () => {
    await write("track.yaml", TRACK);
    await write(
      "chapters/arrays/chapter.yaml",
      "id: arrays\ntitle: Arrays\nskills:\n  - id: indexing\n    name: Indexing\n",
    );
    await write("chapters/arrays/explanation.md", EXPLANATION);
    await write("chapters/arrays/cards.yaml", cards("arrays"));
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:1 the file must have required properties order",
    ]);
  });

  it("reports an unknown field with its line", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1, "difficulty: easy\n");
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:7 difficulty is not a known field",
    ]);
  });

  it("refuses YAML 1.1, where no would turn into false", async () => {
    await write("track.yaml", TRACK);
    await write(
      "chapters/arrays/chapter.yaml",
      `%YAML 1.1\n---\n${chapter("arrays", 1)}`,
    );
    await write("chapters/arrays/explanation.md", EXPLANATION);
    await write("chapters/arrays/cards.yaml", cards("arrays"));
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:1 uses YAML 1.1, but only YAML 1.2 is allowed",
    ]);
  });

  it("keeps no as a string under YAML 1.2", async () => {
    await write("track.yaml", "%YAML 1.2\n---\nid: dsa\ntitle: no\n");
    await writeChapter("arrays", 1);
    const { track: loaded, problems } = await loadTrackChapters(track);
    expect(problems).toEqual([]);
    expect(loaded?.title).toBe("no");
  });

  it("reports a chapter id that doesn't match its folder", async () => {
    await write("track.yaml", TRACK);
    await write("chapters/arrays/chapter.yaml", chapter("lists", 1));
    await write("chapters/arrays/explanation.md", EXPLANATION);
    await write("chapters/arrays/cards.yaml", cards("lists"));
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:1 id lists must match its folder name, arrays",
    ]);
  });

  it("reports two chapters with the same id", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write("chapters/lists/chapter.yaml", chapter("arrays", 2));
    await write("chapters/lists/explanation.md", EXPLANATION);
    await write(
      "chapters/lists/cards.yaml",
      cards("arrays").replace("arrays-card", "lists-card"),
    );
    expect(await problemLines()).toEqual([
      "chapters/lists/chapter.yaml:1 id arrays must match its folder name, lists",
      "chapters/lists/chapter.yaml:1 chapter arrays is used by another chapter",
      "chapters/lists/chapter.yaml:5 skill arrays-skill is also in arrays",
    ]);
  });

  it("reports two chapters in the same place", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await writeChapter("hashing", 1);
    expect(await problemLines()).toEqual([
      "chapters/hashing/chapter.yaml:3 order 1 is also used by arrays",
    ]);
  });

  it("reports a prerequisite that doesn't exist", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1, "prerequisites:\n  - sorting\n");
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:8 prerequisite sorting is not a chapter in this track",
    ]);
  });

  it("reports a chapter that lists itself", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1, "prerequisites:\n  - arrays\n");
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:8 a chapter can't be its own prerequisite",
    ]);
  });

  it("reports prerequisites that go in a circle once", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1, "prerequisites:\n  - hashing\n");
    await writeChapter("hashing", 2, "prerequisites:\n  - arrays\n");
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml:7 prerequisites go in a circle: arrays -> hashing -> arrays",
    ]);
  });

  it("reports a missing chapter file and explanation", async () => {
    await write("track.yaml", TRACK);
    await write("chapters/arrays/notes.txt", "draft");
    expect(await problemLines()).toEqual([
      "chapters/arrays/chapter.yaml is missing",
    ]);
  });

  it("reports a missing explanation", async () => {
    await write("track.yaml", TRACK);
    await write("chapters/arrays/chapter.yaml", chapter("arrays", 1));
    await write("chapters/arrays/cards.yaml", cards("arrays"));
    expect(await problemLines()).toEqual([
      "chapters/arrays/explanation.md is missing",
    ]);
  });

  it("reports an empty explanation", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write("chapters/arrays/explanation.md", "\n  \n");
    expect(await problemLines()).toEqual([
      "chapters/arrays/explanation.md is empty",
    ]);
  });

  it("refuses control characters in an explanation", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write(
      "chapters/arrays/explanation.md",
      "# Arrays\n\nBell \u0007 here\n",
    );
    expect(await problemLines()).toEqual([
      "chapters/arrays/explanation.md:3 must not hold control characters",
    ]);
  });

  it.each(HTML_ATTACKS.filter((attack) => attack.includes("<")))(
    "refuses raw HTML %s in an explanation",
    async (attack) => {
      await write("track.yaml", TRACK);
      await writeChapter("arrays", 1);
      await write("chapters/arrays/explanation.md", `# Arrays\n\n${attack}\n`);
      expect(await problemLines()).toContain(
        "chapters/arrays/explanation.md:3 must not hold raw HTML",
      );
    },
  );

  it("refuses an HTML block with its line", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write(
      "chapters/arrays/explanation.md",
      "# Arrays\n\nText\n\n<div>\nhidden\n</div>\n",
    );
    expect(await problemLines()).toEqual([
      "chapters/arrays/explanation.md:5 must not hold raw HTML",
    ]);
  });

  it("keeps HTML written as code or escaped text", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write(
      "chapters/arrays/explanation.md",
      "# Arrays\n\nUse `<script>` with care, and 1 \\< 2.\n\n```html\n<script>alert(1)</script>\n```\n\n    <b>indented</b>\n\n&lt;b&gt;\n",
    );
    expect(await problemLines()).toEqual([]);
  });

  it.each(URL_ATTACKS.filter((attack) => !attack.startsWith("https://")))(
    "refuses a link to %s",
    async (attack) => {
      await write("track.yaml", TRACK);
      await writeChapter("arrays", 1);
      await write(
        "chapters/arrays/explanation.md",
        `# Arrays\n\n[More](${attack})\n`,
      );
      const lines = await problemLines();
      expect(lines.length).toBeGreaterThan(0);
      expect(
        lines.every((line) =>
          line.startsWith("chapters/arrays/explanation.md:3"),
        ),
      ).toBe(true);
    },
  );

  it("refuses unsafe images and link definitions", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write(
      "chapters/arrays/explanation.md",
      "# Arrays\n\n![Diagram](http://example.com/a.png)\n\n[ref]: javascript:alert(1)\n",
    );
    expect(await problemLines()).toEqual([
      'chapters/arrays/explanation.md:3 link "http://example.com/a.png" must start with https:// or #',
      'chapters/arrays/explanation.md:5 link "javascript:alert(1)" must start with https:// or #',
    ]);
  });

  it("accepts https links and links within the explanation", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write(
      "chapters/arrays/explanation.md",
      "# Arrays\n\nSee [the spec](https://spec.commonmark.org/0.31.2/) and [below](#cost).\n\n<https://example.com>\n",
    );
    expect(await problemLines()).toEqual([]);
  });

  it("accepts Windows line endings in an explanation", async () => {
    await write("track.yaml", TRACK);
    await writeChapter("arrays", 1);
    await write("chapters/arrays/explanation.md", "# Arrays\r\n\r\nText\r\n");
    expect(await problemLines()).toEqual([]);
  });
});
