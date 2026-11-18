import { describe, expect, it } from "vitest";
import { canonicalJson, fitsType } from "./values.ts";

describe("fitsType", () => {
  it.each([
    ["int", 0],
    ["int", -(2 ** 31)],
    ["int", 2 ** 31 - 1],
    ["long", 2 ** 40],
    ["double", 1.5],
    ["double", 2],
    ["boolean", false],
    ["char", "a"],
    ["string", ""],
    ["string", "héllo"],
    ["int[]", []],
    ["int[][]", [[1], [], [2, 3]]],
    ["string[]", ["a", "b"]],
    ["ListNode", [1, 2, 3]],
    ["ListNode", []],
    ["TreeNode", [3, 9, 20, null, null, 15, 7]],
    ["TreeNode", []],
    ["ListNode[]", [[1, 4], [2]]],
  ])("accepts %s %j", (type, value) => {
    expect(fitsType(type, value)).toBe(true);
  });

  it.each([
    ["int", 1.5],
    ["int", 2 ** 31],
    ["int", "1"],
    ["long", 2 ** 60],
    ["double", null],
    ["boolean", 0],
    ["char", "ab"],
    ["char", ""],
    ["char", "é"],
    ["string", null],
    ["int[]", [1, "2"]],
    ["int[]", null],
    ["int[][]", [1, 2]],
    ["ListNode", [1, null]],
    ["TreeNode", [null, 1]],
    ["TreeNode", [1, "x"]],
    ["unknown", 1],
  ])("refuses %s %j", (type, value) => {
    expect(fitsType(type, value)).toBe(false);
  });
});

describe("canonicalJson", () => {
  it("sorts keys at every level, so key order doesn't change a hash", () => {
    expect(
      canonicalJson({ b: 1, a: { d: [2, { f: 1, e: 0 }], c: null } }),
    ).toBe('{"a":{"c":null,"d":[2,{"e":0,"f":1}]},"b":1}');
  });
});
