import { describe, expect, it } from "vitest";
import { markdownProblems } from "./explanation.ts";
import { isSafeUrl, parseMarkdown } from "./markdown.ts";

const TABLE = "| Operation | Cost |\n|---|---|\n| Read by index | `O(1)` |\n";

describe("parseMarkdown", () => {
  it("reads a GFM table as a table", () => {
    const [table] = parseMarkdown(TABLE).children;
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    expect(table.children).toHaveLength(2);
    expect(table.children[1]?.children[1]?.children[0]).toMatchObject({
      type: "inlineCode",
      value: "O(1)",
    });
  });

  it("reads Windows line endings the same way", () => {
    const unix = parseMarkdown(TABLE).children[0]?.type;
    expect(
      parseMarkdown(TABLE.replaceAll("\n", "\r\n")).children[0]?.type,
    ).toBe(unix);
  });
});

describe("markdownProblems in tables", () => {
  it("finds an unsafe link inside a table cell", () => {
    const text = "| a |\n|---|\n| [x](javascript:alert(1)) |\n";
    expect(markdownProblems(text).map((p) => p.message)).toEqual([
      'link "javascript:alert(1)" must start with https:// or #',
    ]);
  });

  it("finds raw HTML inside a table cell", () => {
    const text = "| a |\n|---|\n| <img src=x onerror=alert(1)> |\n";
    expect(markdownProblems(text).map((p) => p.message)).toEqual([
      "must not hold raw HTML",
    ]);
  });
});

describe("isSafeUrl", () => {
  it.each(["https://docs.oracle.com/", "#arrays"])("allows %s", (url) =>
    expect(isSafeUrl(url)).toBe(true),
  );

  it.each([
    "http://example.com",
    "javascript:alert(1)",
    "https:///evil",
    "https:/\\evil",
    "//evil.example",
    "mailto:a@b.c",
    "",
  ])("refuses %j", (url) => expect(isSafeUrl(url)).toBe(false));
});
