import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { gfmTable } from "micromark-extension-gfm-table";
import { SOURCE_URL_PATTERN } from "./source-url.ts";

/** A parsed Markdown document */
export type MarkdownRoot = ReturnType<typeof fromMarkdown>;

// Links may leave only for https pages or jump within the text
const SAFE_URL = /^(https:\/\/[^/\\]|#)/;
const NO_USER_NAME = new RegExp(SOURCE_URL_PATTERN);

/** Whether a link or image may point here */
export function isSafeUrl(url: string): boolean {
  if (!SAFE_URL.test(url)) return false;
  return url.startsWith("#") || NO_USER_NAME.test(url);
}

/**
 * Parses CommonMark plus GFM tables, the only extension content may use.
 * The content check and every renderer read text through this, so what's
 * checked is what's shown.
 */
export function parseMarkdown(text: string): MarkdownRoot {
  return fromMarkdown(text.replaceAll("\r\n", "\n"), {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown()],
  });
}
