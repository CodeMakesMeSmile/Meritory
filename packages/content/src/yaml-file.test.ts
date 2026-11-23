import { describe, expect, it } from "vitest";
import { type Problem, parseYaml } from "./yaml-file.ts";

describe("parseYaml", () => {
  it("reports an alias bomb as a problem", () => {
    const bomb = [
      "a: &a [x, x, x, x, x, x, x, x, x, x]",
      "b: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a, *a]",
      "c: &c [*b, *b, *b, *b, *b, *b, *b, *b, *b, *b]",
      "d: [*c, *c, *c, *c, *c, *c, *c, *c, *c, *c]",
      "",
    ].join("\n");
    const problems: Problem[] = [];
    expect(parseYaml("bomb.yaml", bomb, problems).data).toBeUndefined();
    expect(problems).toEqual([
      {
        file: "bomb.yaml",
        line: null,
        message: "repeats its aliases too many times",
      },
    ]);
  });

  it("still reads a file with a few aliases", () => {
    const problems: Problem[] = [];
    const { data } = parseYaml("ok.yaml", "a: &a [1]\nb: *a\n", problems);
    expect(data).toEqual({ a: [1], b: [1] });
    expect(problems).toEqual([]);
  });
});
