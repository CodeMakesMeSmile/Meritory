import {
  CONTROL_ATTACKS,
  HTML_ATTACKS,
  URL_ATTACKS,
} from "@meritory/security-testing";
import Value from "typebox/value";
import { describe, expect, it } from "vitest";
import { Fact } from "./fact.ts";

const fact = {
  id: "sorted-set-rank",
  claim: "A sorted set returns one member's rank without a scan.",
  examples: [{ product: "Example Store", version: "8.2" }],
  sources: [
    { url: "https://docs.example.test/sorted-sets", title: "Sorted sets" },
  ],
  checkedOn: "2026-11-02",
};

const withSourceUrl = (url: string) => ({
  ...fact,
  sources: [{ url, title: "A source" }],
});

describe("Fact", () => {
  it("accepts a fact with a source and a date", () => {
    expect(Value.Check(Fact, fact)).toBe(true);
  });

  it("accepts a fact with no product examples", () => {
    const { examples: _, ...plain } = fact;
    expect(Value.Check(Fact, plain)).toBe(true);
  });

  it("rejects a fact with no source", () => {
    const { sources: _, ...unsourced } = fact;
    expect(Value.Check(Fact, unsourced)).toBe(false);
    expect(Value.Check(Fact, { ...fact, sources: [] })).toBe(false);
  });

  it("rejects a fact with no date", () => {
    const { checkedOn: _, ...undated } = fact;
    expect(Value.Check(Fact, undated)).toBe(false);
  });

  it.each([
    "2026-02-30",
    "2026-13-01",
    "2026-1-2",
    "11/02/2026",
    "2026-11-02T00:00:00Z",
  ])("rejects the date %s", (checkedOn) => {
    expect(Value.Check(Fact, { ...fact, checkedOn })).toBe(false);
  });

  it("rejects fields it doesn't know", () => {
    expect(Value.Check(Fact, { ...fact, best: true })).toBe(false);
  });

  it.each(["Sorted Set", "sorted_set", "-rank", "rank-", "a--b", ""])(
    "rejects the id %j",
    (id) => {
      expect(Value.Check(Fact, { ...fact, id })).toBe(false);
    },
  );
});

describe("Fact sources", () => {
  it.each(URL_ATTACKS.filter((url) => !url.startsWith("https://")))(
    "rejects the link %s",
    (url) => {
      expect(Value.Check(Fact, withSourceUrl(url))).toBe(false);
    },
  );

  it.each([
    "http://docs.example.test/page",
    "HTTPS://docs.example.test/page",
    "ftp://docs.example.test/file",
    "https://user:pass@docs.example.test/page",
    "https://docs.example.test@evil.example/page",
    "https://docs.example .test/page",
    "https://",
  ])("rejects the link %s", (url) => {
    expect(Value.Check(Fact, withSourceUrl(url))).toBe(false);
  });

  it.each([
    "https://docs.example.test",
    "https://docs.example.test/",
    "https://docs.example.test:8443/a/b?c=d#e",
    "https://docs.example.test/users/@someone",
  ])("accepts the link %s", (url) => {
    expect(Value.Check(Fact, withSourceUrl(url))).toBe(true);
  });
});

describe("Fact text", () => {
  it.each(CONTROL_ATTACKS)("rejects control characters in %j", (claim) => {
    expect(Value.Check(Fact, { ...fact, claim })).toBe(false);
  });

  it("keeps newlines and tabs in a claim", () => {
    const claim = "First line.\n\tSecond line.";
    expect(Value.Check(Fact, { ...fact, claim })).toBe(true);
  });

  // React escapes these when it renders, so they stay plain text
  it.each(HTML_ATTACKS)("keeps markup as text in %s", (claim) => {
    expect(Value.Check(Fact, { ...fact, claim })).toBe(true);
  });
});
