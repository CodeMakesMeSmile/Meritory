import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatProblem, loadTrackFacts } from "./load.ts";

const TODAY = "2026-11-12";

const CATEGORIES = `- id: key-value
  name: Key-value store
- id: message-queue
  name: Message queue
`;

const KEY_VALUE = `category: key-value
facts:
  - id: sorted-set-rank
    claim: A sorted set returns one member's rank without a scan.
    examples:
      - product: Example Store
        version: "8.2"
    sources:
      - url: https://docs.example.test/sorted-sets
        title: Sorted sets
    checkedOn: 2026-11-02
`;

let track: string;

async function write(name: string, text: string) {
  const file = path.join(track, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

async function problemLines() {
  const { problems } = await loadTrackFacts(track, TODAY);
  return problems.map((problem) => formatProblem(problem, track));
}

beforeEach(async () => {
  track = await mkdtemp(path.join(tmpdir(), "meritory-track-"));
});

afterEach(async () => {
  await rm(track, { recursive: true, force: true });
});

describe("loadTrackFacts", () => {
  it("loads facts with the category they were filed under", async () => {
    await write("categories.yaml", CATEGORIES);
    await write("facts/key-value.yaml", KEY_VALUE);

    const { facts, problems } = await loadTrackFacts(track, TODAY);

    expect(problems).toEqual([]);
    expect(facts).toEqual([
      expect.objectContaining({
        id: "sorted-set-rank",
        category: "key-value",
        checkedOn: "2026-11-02",
        examples: [{ product: "Example Store", version: "8.2" }],
      }),
    ]);
  });

  it("keeps facts past their recheck date for callers to filter", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("2026-11-02", "2025-01-10"),
    );

    const { facts, problems } = await loadTrackFacts(track, TODAY);

    expect(problems).toEqual([]);
    expect(facts.map((fact) => fact.checkedOn)).toEqual(["2025-01-10"]);
  });

  it("has nothing to load for a track with no folder", async () => {
    const missing = path.join(track, "no-such-track");
    expect(await loadTrackFacts(missing, TODAY)).toEqual({
      facts: [],
      problems: [],
    });
  });

  it("needs a categories file once there are facts", async () => {
    await write("facts/key-value.yaml", KEY_VALUE);
    expect(await problemLines()).toEqual([
      "categories.yaml is missing, so no fact has a category to point to",
    ]);
  });

  it("points at the line of a missing date", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("    checkedOn: 2026-11-02\n", ""),
    );
    const lines = await problemLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^facts\/key-value\.yaml:3 facts\/0 .*checkedOn/);
  });

  it("points at the line of an unsafe link", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace(
        "https://docs.example.test/sorted-sets",
        "javascript:alert(1)",
      ),
    );
    expect(await problemLines()).toEqual([
      "facts/key-value.yaml:9 facts/0/sources/0/url must be an https link with no user name",
    ]);
  });

  it("names a field it doesn't know", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("    claim:", "    best: true\n    claim:"),
    );
    expect(await problemLines()).toEqual([
      "facts/key-value.yaml:4 facts/0/best is not a known field",
    ]);
  });

  it("refuses a category that isn't listed", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("category: key-value", "category: graph"),
    );
    expect(await problemLines()).toEqual([
      "facts/key-value.yaml:1 category graph is not in categories.yaml",
    ]);
  });

  it("refuses a category listed twice", async () => {
    await write(
      "categories.yaml",
      `${CATEGORIES}- id: key-value\n  name: Key-value again\n`,
    );
    expect(await problemLines()).toEqual([
      "categories.yaml:5 category key-value is listed twice",
    ]);
  });

  it("refuses a fact id used in two files", async () => {
    await write("categories.yaml", CATEGORIES);
    await write("facts/key-value.yaml", KEY_VALUE);
    await write(
      "facts/message-queue.yaml",
      KEY_VALUE.replace("category: key-value", "category: message-queue"),
    );
    expect(await problemLines()).toEqual([
      "facts/message-queue.yaml:3 fact sorted-set-rank is used by another fact",
    ]);
  });

  it("refuses a date after today", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("2026-11-02", "2062-11-02"),
    );
    expect(await problemLines()).toEqual([
      "facts/key-value.yaml:11 fact sorted-set-rank was checked on 2062-11-02, which is after today",
    ]);
  });

  it("reports YAML that doesn't parse, with its line", async () => {
    await write("categories.yaml", CATEGORIES);
    await write(
      "facts/key-value.yaml",
      KEY_VALUE.replace("    checkedOn:", "    claim: twice\n    checkedOn:"),
    );
    const lines = await problemLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(
      /^facts\/key-value\.yaml:11 Map keys must be unique/,
    );
  });

  it("reads only YAML files from the facts folder", async () => {
    await write("categories.yaml", CATEGORIES);
    await write("facts/key-value.yaml", KEY_VALUE);
    await write("facts/notes.txt", "not a fact file");
    const { facts, problems } = await loadTrackFacts(track, TODAY);
    expect(problems).toEqual([]);
    expect(facts).toHaveLength(1);
  });
});
