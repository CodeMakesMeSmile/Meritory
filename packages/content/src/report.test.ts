import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HTML_ATTACKS } from "@meritory/security-testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LoadedFact } from "./load.ts";
import { recheckReport } from "./recheck.ts";
import {
  escapeData,
  escapeProperty,
  formatAnnotations,
  formatSummary,
  formatText,
  runRecheck,
} from "./report.ts";

const TODAY = "2026-11-12";
const ROOT = path.join(tmpdir(), "repo");
const FILE = path.join(ROOT, "content", "stack-decisions", "facts", "kv.yaml");

function fact(
  id: string,
  checkedOn: string,
  extra: Partial<LoadedFact> = {},
): LoadedFact {
  return {
    id,
    claim: "A claim.",
    sources: [{ url: `https://docs.example.test/${id}`, title: "Docs" }],
    checkedOn,
    category: "key-value",
    file: FILE,
    line: 3,
    ...extra,
  };
}

const overdue = fact("stale-fact", "2026-05-02");
const dueSoon = fact("soon-fact", "2026-06-01", { line: 12 });
const fresh = fact("fresh-fact", "2026-11-02");
const report = recheckReport([fresh, dueSoon, overdue], TODAY);
const empty = recheckReport([], TODAY);

describe("escapeData and escapeProperty", () => {
  it("escapes what would end a workflow command", () => {
    expect(escapeData("50%\r\n::error::x")).toBe("50%25%0D%0A::error::x");
  });

  it("also escapes the separators between properties", () => {
    expect(escapeProperty("a:b,c\n%")).toBe("a%3Ab%2Cc%0A%25");
  });
});

describe("formatText", () => {
  it("says so when nothing is due", () => {
    expect(formatText(empty, ROOT)).toBe(
      "No facts are due for a recheck in the next 30 days.",
    );
  });

  it("lists overdue facts, then facts due soon, with source and date", () => {
    expect(formatText(report, ROOT)).toBe(
      [
        "1 fact is past the recheck date and hidden from learners:",
        "  stale-fact (key-value), due 2026-11-02",
        "    checked on 2026-05-02 in content/stack-decisions/facts/kv.yaml:3",
        "    https://docs.example.test/stale-fact",
        "",
        "1 fact is due within 30 days:",
        "  soon-fact (key-value), due 2026-12-01",
        "    checked on 2026-06-01 in content/stack-decisions/facts/kv.yaml:12",
        "    https://docs.example.test/soon-fact",
      ].join("\n"),
    );
  });

  it("counts more than one fact", () => {
    const two = recheckReport([overdue, fact("b", "2026-01-01")], TODAY);
    expect(formatText(two, ROOT)).toMatch(/^2 facts are past/);
  });
});

describe("formatAnnotations", () => {
  it("warns about overdue facts and notes facts due soon", () => {
    expect(formatAnnotations(report, ROOT)).toEqual([
      "::warning file=content/stack-decisions/facts/kv.yaml,line=3,title=Fact past its recheck date::stale-fact was due on 2026-11-02 and is hidden from learners. Checked on 2026-05-02. Sources: https://docs.example.test/stale-fact",
      "::notice file=content/stack-decisions/facts/kv.yaml,line=12,title=Fact due for a recheck::soon-fact is due on 2026-12-01. Checked on 2026-06-01. Sources: https://docs.example.test/soon-fact",
    ]);
  });

  it("leaves out the line when it isn't known", () => {
    const [line] = formatAnnotations(
      recheckReport([fact("no-line", "2026-01-01", { line: null })], TODAY),
      ROOT,
    );
    expect(line).toMatch(/^::warning file=[^,]+,title=/);
  });

  it("keeps every annotation on one line", () => {
    const sneaky = fact("sneaky", "2026-01-01", {
      sources: [
        { url: "https://docs.example.test/a\n::error::forged", title: "A" },
      ],
      file: path.join(ROOT, "content", "a,b:c.yaml"),
    });
    const [line] = formatAnnotations(recheckReport([sneaky], TODAY), ROOT);
    expect(line?.split("\n")).toHaveLength(1);
    expect(line).toContain("file=content/a%2Cb%3Ac.yaml,");
    expect(line).toContain("a%0A::error::forged");
  });
});

describe("formatSummary", () => {
  it("says so when nothing is due", () => {
    expect(formatSummary(empty, ROOT, TODAY)).toContain("Nothing is due.");
  });

  it("puts each fact on a table row with its sources linked", () => {
    const summary = formatSummary(report, ROOT, TODAY);
    expect(summary).toContain(
      "| Overdue, hidden | 2026-11-02 | `stale-fact` | key-value | 2026-05-02 | content/stack-decisions/facts/kv.yaml:3 | [Docs](https://docs.example.test/stale-fact) |",
    );
    expect(summary).toContain("| Due soon | 2026-12-01 | `soon-fact` |");
  });

  it("keeps a title from breaking the table or the link", () => {
    const tricky = fact("tricky", "2026-01-01", {
      sources: [
        { url: "https://docs.example.test/a_(b)", title: "x | y ] z\nw" },
      ],
    });
    const summary = formatSummary(recheckReport([tricky], TODAY), ROOT, TODAY);
    expect(summary).toContain(
      "[x \\| y \\] z w](https://docs.example.test/a_%28b%29)",
    );
  });

  it.each(HTML_ATTACKS)("writes markup in %s as text", (title) => {
    const marked = fact("marked", "2026-01-01", {
      sources: [{ url: "https://docs.example.test/", title }],
    });
    const summary = formatSummary(recheckReport([marked], TODAY), ROOT, TODAY);
    expect(summary).not.toMatch(/<(script|img|svg|a)\b/i);
  });
});

describe("runRecheck", () => {
  let root: string;
  let out: string[];
  let err: string[];

  const track = () => path.join(root, "content", "stack-decisions");

  async function write(name: string, text: string) {
    const file = path.join(track(), name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
  }

  const run = (extra: { github?: boolean; summaryFile?: string } = {}) =>
    runRecheck({
      trackDir: track(),
      root,
      today: TODAY,
      out: (text) => out.push(text),
      err: (text) => err.push(text),
      ...extra,
    });

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "meritory-recheck-"));
    out = [];
    err = [];
    await write("categories.yaml", "- id: key-value\n  name: Key-value\n");
    await write(
      "facts/key-value.yaml",
      `category: key-value
facts:
  - id: stale-fact
    claim: A claim.
    sources:
      - url: https://docs.example.test/stale
        title: Docs
    checkedOn: 2026-05-02
`,
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("prints the report and passes with an overdue fact", async () => {
    expect(await run()).toBe(0);
    expect(out.join("\n")).toContain("stale-fact (key-value), due 2026-11-02");
    expect(out.join("\n")).not.toContain("::");
    expect(err).toEqual([]);
  });

  it("adds annotations and a summary on GitHub Actions", async () => {
    const summaryFile = path.join(root, "summary.md");
    expect(await run({ github: true, summaryFile })).toBe(0);
    expect(out).toContainEqual(
      expect.stringMatching(
        /^::warning file=content\/stack-decisions\/facts\/key-value\.yaml,line=3,/,
      ),
    );
    expect(await readFile(summaryFile, "utf8")).toContain("`stale-fact`");
  });

  it("fails on content with problems, before any report", async () => {
    await write("facts/key-value.yaml", "category: key-value\nfacts: oops\n");
    expect(await run({ github: true })).toBe(1);
    expect(err).toEqual([
      "content/stack-decisions/facts/key-value.yaml:2 facts must be array",
    ]);
    expect(out).toEqual([
      "::error file=content/stack-decisions/facts/key-value.yaml,line=2::facts must be array",
    ]);
  });

  it("has nothing to report for a track with no folder", async () => {
    await rm(track(), { recursive: true });
    expect(await run()).toBe(0);
    expect(out).toEqual([
      "No facts are due for a recheck in the next 30 days.",
    ]);
  });
});
