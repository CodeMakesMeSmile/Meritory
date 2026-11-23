import { parseMarkdown } from "@meritory/content/markdown";
import { describe, expect, it } from "vitest";
import {
  isInline,
  linkTarget,
  listMarker,
  type MarkdownNode,
  plainText,
} from "./markdown-nodes";

describe("phone markdown nodes", () => {
  it("opens only https links", () => {
    expect(linkTarget("https://example.com/page")).toBe(
      "https://example.com/page",
    );
    expect(linkTarget("http://example.com")).toBeNull();
    expect(linkTarget("javascript:alert(1)")).toBeNull();
    expect(linkTarget("app.meritory.mobile://x")).toBeNull();
    expect(linkTarget("https://user@example.com")).toBeNull();
    expect(linkTarget("#section")).toBeNull();
    expect(linkTarget(undefined)).toBeNull();
  });

  it("reads the words of a node without raw HTML", () => {
    const root = parseMarkdown(
      "A **bold** `code` word<script>x</script>",
    ) as MarkdownNode;
    expect(plainText(root)).toBe("A bold code wordx");
  });

  it("numbers an ordered list from its start", () => {
    const [list] = (parseMarkdown("3. a\n4. b") as MarkdownNode).children ?? [];
    expect(listMarker(list as MarkdownNode, 0)).toBe("3.");
    expect(listMarker(list as MarkdownNode, 1)).toBe("4.");
    expect(listMarker({ type: "list", ordered: false }, 0)).toBe("•");
  });

  it("tells inline nodes from blocks", () => {
    expect(isInline({ type: "strong" })).toBe(true);
    expect(isInline({ type: "paragraph" })).toBe(false);
    expect(isInline({ type: "code" })).toBe(false);
  });
});
