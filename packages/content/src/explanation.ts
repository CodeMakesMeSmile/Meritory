import { isSafeUrl, parseMarkdown } from "./markdown.ts";
import type { Problem } from "./yaml-file.ts";

// Control characters other than tab and newline
// biome-ignore lint/suspicious/noControlCharactersInRegex: these are what it finds
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/;

type MarkdownNode = {
  type: string;
  url?: string;
  position?: { start: { line: number } };
  children?: MarkdownNode[];
};

/** A problem in CommonMark text, with its line counted from 1 */
export type MarkdownProblem = { line: number | null; message: string };

/** Finds raw HTML and unsafe links in CommonMark text */
export function markdownProblems(text: string): MarkdownProblem[] {
  const problems: MarkdownProblem[] = [];
  const visit = (node: MarkdownNode) => {
    const line = node.position?.start.line ?? null;
    if (node.type === "html") {
      problems.push({ line, message: "must not hold raw HTML" });
    }
    if (node.url !== undefined && !isSafeUrl(node.url)) {
      problems.push({
        line,
        // Quoted as JSON, so a control character in it can't reach a terminal
        message: `link ${JSON.stringify(node.url)} must start with https:// or #`,
      });
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(parseMarkdown(text));
  return problems;
}

/** Checks a chapter's CommonMark explanation */
export function checkExplanation(
  file: string,
  text: string,
  problems: Problem[],
) {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
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
  for (const problem of markdownProblems(text)) {
    problems.push({ file, ...problem });
  }
}
