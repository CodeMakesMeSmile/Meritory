import { isSafeUrl } from "@meritory/content/markdown";

/** The parts of an mdast node the phone renderer reads */
export interface MarkdownNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  depth?: number;
  ordered?: boolean | null;
  start?: number | null;
  children?: MarkdownNode[];
}

/** The words of a node and everything under it */
export function plainText(node: MarkdownNode): string {
  if (node.type === "html") return "";
  if (node.value !== undefined) return node.value;
  if (node.type === "image") return node.alt ?? "";
  return (node.children ?? []).map(plainText).join("");
}

/** The address a link may open in the browser, or null when it stays plain words */
export function linkTarget(url: string | undefined): string | null {
  // A jump within the text has nowhere to go on a card
  if (url === undefined || url.startsWith("#")) return null;
  return isSafeUrl(url) ? url : null;
}

const INLINE = new Set([
  "text",
  "emphasis",
  "strong",
  "delete",
  "inlineCode",
  "break",
  "link",
  "image",
  "html",
]);

/** Whether a node sits inside a line of text, not in its own block */
export const isInline = (node: MarkdownNode) => INLINE.has(node.type);

/** What a list item shows before its words */
export function listMarker(list: MarkdownNode, index: number): string {
  return list.ordered ? `${(list.start ?? 1) + index}.` : "•";
}
