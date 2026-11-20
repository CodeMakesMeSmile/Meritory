import { fileURLToPath } from "node:url";
import { canonicalJson } from "@meritory/content";
import { buildBundle } from "@meritory/content/node";
import { indexContent, type ServedContent } from "./content.ts";

export const CONTENT_DIR = fileURLToPath(
  new URL("../../../content/", import.meta.url),
);

let built: Promise<ServedContent> | undefined;

/** The real curriculum, built the way `pnpm content:build` writes it */
export function builtContent(): Promise<ServedContent> {
  built ??= buildBundle(CONTENT_DIR).then(({ bundle }) => {
    if (!bundle)
      throw new Error("The content has problems, so run pnpm content:build");
    return {
      hash: bundle.hash,
      text: `${canonicalJson(bundle)}\n`,
      chapters: indexContent(bundle),
    };
  });
  return built;
}
