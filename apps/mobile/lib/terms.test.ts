import { describe, expect, it } from "vitest";
import { splitTerms } from "./terms";

const hash = { term: "hash", definition: "A number made from a key." };
const table = { term: "hash table", definition: "Buckets found by hash." };

describe("defined terms in a step", () => {
  it("leaves words alone when nothing is defined", () => {
    expect(splitTerms("Find the bucket", [])).toEqual([
      { text: "Find the bucket" },
    ]);
  });

  it("marks a term whatever its case", () => {
    expect(splitTerms("Hash the key", [hash])).toEqual([
      { text: "Hash", term: hash },
      { text: " the key" },
    ]);
  });

  it("prefers the longest term", () => {
    expect(splitTerms("Grow the hash table", [hash, table])).toEqual([
      { text: "Grow the " },
      { text: "hash table", term: table },
    ]);
  });

  it("treats a term's punctuation as plain text", () => {
    const big = { term: "O(1)", definition: "Constant time." };
    expect(splitTerms("Runs in O(1) time", [big])).toEqual([
      { text: "Runs in " },
      { text: "O(1)", term: big },
      { text: " time" },
    ]);
  });
});
