import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { canonicalJson } from "@meritory/content";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ifNoneMatchHits, loadContent } from "./content.ts";
import { builtContent } from "./test-content.ts";

// Building the whole curriculum can take longer than one test's time limit when every file runs at once
beforeAll(async () => {
  await builtContent();
}, 60000);

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "meritory-content-"));
  file = path.join(dir, "bundle.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("loadContent", () => {
  it("keeps the built file's exact text and its hash", async () => {
    const built = await builtContent();
    await writeFile(file, built.text);
    expect(await loadContent(file)).toEqual(built);
  });

  it("says how to build a missing bundle", async () => {
    await expect(loadContent(file)).rejects.toThrow(
      `No content bundle at ${file}. Build it with pnpm content:build.`,
    );
  });

  it("refuses a file that isn't JSON", async () => {
    await writeFile(file, "{ not json");
    await expect(loadContent(file)).rejects.toThrow("isn't valid JSON");
  });

  it("refuses a bundle that doesn't fit the schema, naming where", async () => {
    const bundle = JSON.parse((await builtContent()).text);
    bundle.tracks[0].chapters[0].cards[0].version = 0;
    await writeFile(file, canonicalJson(bundle));
    await expect(loadContent(file)).rejects.toThrow(
      /doesn't fit its schema[\s\S]*\/tracks\/0\/chapters\/0\/cards\/0/,
    );
  });

  it("refuses a bundle edited after it was built", async () => {
    const bundle = JSON.parse((await builtContent()).text);
    bundle.tracks[0].title = "Edited by hand";
    await writeFile(file, canonicalJson(bundle));
    await expect(loadContent(file)).rejects.toThrow("doesn't match its hash");
  });
});

describe("ifNoneMatchHits", () => {
  const tag = "abc123";

  it.each([
    ["the same tag", '"abc123"'],
    ["the weak form", 'W/"abc123"'],
    ["one of a list", '"old", W/"abc123" , "older"'],
    ["any tag", "*"],
    ["any tag with spaces", " * "],
  ])("matches %s", (_name, header) => {
    expect(ifNoneMatchHits(header, tag)).toBe(true);
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["another tag", '"def456"'],
    ["a tag the hash only starts with", '"abc"'],
    ["a tag that only starts with the hash", '"abc1234"'],
    ["a tag without quotes", "abc123"],
    ["a comma inside another tag", '"abc123,x"'],
  ])("doesn't match %s", (_name, header) => {
    expect(ifNoneMatchHits(header, tag)).toBe(false);
  });

  it("reads a header sent more than once", () => {
    expect(ifNoneMatchHits(['"old"', '"abc123"'], tag)).toBe(true);
  });
});
