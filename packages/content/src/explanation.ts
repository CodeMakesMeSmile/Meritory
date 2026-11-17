import { fromMarkdown } from "mdast-util-from-markdown";
import type { Problem } from "./yaml-file.ts";

// Control characters other than tab and newline
// biome-ignore lint/suspicious/noControlCharactersInRegex: these are what it finds
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/;

// Links may leave only for https pages or jump within the explanation
const SAFE_URL = /^(https:\/\/[^/\\]|#)/;

type MarkdownNode = {
  type: string;
  url?: string;
  position?: { start: { line: number } };
  children?: MarkdownNode[];
};

/** Checks a chapter's CommonMark explanation */
export function checkExplanation(
  file: string,
  text: string,
  problems: Problem[],
) {
  const normalized = text.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  if (lines.every((line) => line.trim() === "")) {
    problems.push({ file, line: null, message: "is empty" });
    return;
  }
  lines.forEach((line, index) => {
    if (CONTROL.test(line)) {
      problems.push({
        file,
        line: index + 1,
        message: "must not hold control characters",
      });
    }
  });
  checkNodes(file, fromMarkdown(normalized), problems);
}

function checkNodes(file: string, node: MarkdownNode, problems: Problem[]) {
  const line = node.position?.start.line ?? null;
  if (node.type === "html") {
    problems.push({ file, line, message: "must not hold raw HTML" });
  }
  if (node.url !== undefined && !SAFE_URL.test(node.url)) {
    problems.push({
      file,
      line,
      message: `link ${node.url} must start with https:// or #`,
    });
  }
  for (const child of node.children ?? []) checkNodes(file, child, problems);
}
