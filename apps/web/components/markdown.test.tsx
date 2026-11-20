import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown, markdownHeadings } from "./markdown.tsx";

const html = (text: string, inline = false) =>
  renderToStaticMarkup(<Markdown text={text} inline={inline} />);

describe("Markdown", () => {
  it("renders the parts chapters use", () => {
    const out = html(
      "Intro with *stress*, **weight**, and `O(1)`.\n\n- one\n- two\n\n```\ncode\n```\n",
    );
    expect(out).toContain("<em>stress</em>");
    expect(out).toContain('<strong class="font-semibold">weight</strong>');
    expect(out).toContain("O(1)</code>");
    expect(out).toContain("<ul");
    expect(out).toContain("<pre");
  });

  it("renders a table in its own scrolling region", () => {
    const out = html("| Operation | Cost |\n|---|---|\n| Read | `O(1)` |\n");
    expect(out).toContain("<section");
    expect(out).toContain('aria-label="Table: Operation, Cost"');
    expect(out).toContain('<th scope="col"');
    expect(out).toContain("O(1)</code></td>");
  });

  it("leaves out the title and gives headings the ids the page lists", () => {
    const text = "# Title\n\n## Arrays\n\n### Arrays\n\nText\n";
    const out = html(text);
    expect(out).not.toContain("Title");
    expect(markdownHeadings(text)).toEqual([
      { depth: 2, text: "Arrays", id: "arrays" },
      { depth: 3, text: "Arrays", id: "arrays-2" },
    ]);
    expect(out).toContain('id="arrays"');
    expect(out).toContain('id="arrays-2"');
  });

  it("drops raw HTML instead of showing or running it", () => {
    const out = html(
      'Before\n\n<script>alert(1)</script>\n\nAfter <img src=x onerror="alert(1)">',
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("&lt;script");
    expect(out).toContain("Before");
  });

  it.each([
    "javascript:alert(1)",
    "http://example.com",
    "//evil.example",
    "data:text/html,hi",
  ])("shows a %s link as plain words", (url) => {
    const out = html(`[click](${url})`);
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href");
    expect(out).toContain("click");
  });

  it("keeps https and in-page links", () => {
    expect(html("[docs](https://docs.oracle.com/)")).toContain(
      'href="https://docs.oracle.com/"',
    );
    expect(html("[up](#arrays)")).toContain('href="#arrays"');
  });

  it("shows an image's words, never the image", () => {
    const out = html("![a hash table](https://example.com/x.png)");
    expect(out).not.toContain("<img");
    expect(out).toContain("a hash table");
  });

  it("drops the paragraph around a one-line prompt", () => {
    expect(html("Why does `x` grow?", true)).toBe(
      '<span>Why does <code class="font-mono text-code">x</code> grow?</span>',
    );
  });

  it.each(ATTACKS)("never turns %j into markup", (attack) => {
    for (const text of [
      `Text ${attack} end`,
      `[${attack}](${attack})`,
      `| ${attack} |\n|---|\n| ${attack} |`,
    ]) {
      const out = html(text);
      expect(out).not.toMatch(/<(script|img|svg|iframe|style)/i);
      expect(out).not.toMatch(/\son\w+=/i);
      expect(out).not.toMatch(/href="(?!https:\/\/|#)/i);
    }
  });

  it("escapes words that look like markup", () => {
    const attack = "a < b && c > d";
    expect(html(attack)).toContain(escapeHtml(attack));
  });
});
