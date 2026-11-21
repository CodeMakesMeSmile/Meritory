import type { ContentResponse } from "@meritory/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ content: null as unknown }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, refresh: () => {} }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/server-api", () => ({
  requireMe: async () => ({ id: "1", name: "Rowan", email: "a@b.test" }),
  getContent: async () => api.content,
}));

const { default: ExercisePage } = await import("./page.tsx");

const levels = ["Weak.", "Thin.", "Solid.", "Strong."];

function content() {
  return {
    hash: "h",
    tracks: [
      {
        id: "system-design",
        title: "System design",
        rubrics: [
          {
            id: "design-review",
            title: "Design review",
            criteria: [
              {
                id: "requirements",
                name: "Requirements",
                scoredBy: "self",
                levels,
              },
            ],
            pass: { total: 3, lowest: 2 },
            hash: "h",
            version: 1,
          },
          {
            id: "story-review",
            title: "Story review",
            criteria: [
              { id: "result", name: "Result", scoredBy: "self", levels },
            ],
            pass: { total: 3, lowest: 2 },
            hash: "h",
            version: 1,
          },
          {
            id: "quick-check",
            title: "Quick check",
            criteria: [{ id: "idea", name: "Idea", scoredBy: "self", levels }],
            pass: { total: 3, lowest: 2 },
            hash: "h",
            version: 1,
          },
        ],
        chapters: [
          {
            id: "case-studies",
            title: "Case studies",
            order: 10,
            skills: [{ id: "s", name: "Skill" }],
            explanation: "# Cases",
            cards: [],
            exercises: [
              {
                id: "unified-api",
                kind: "design",
                title: "A unified API",
                difficulty: "hard",
                skills: ["s"],
                sibling: "webhooks",
                rubric: "design-review",
                statement:
                  "Design an API over many providers. <script>x</script>",
                answer: "THE MODEL ANSWER",
                hash: "h",
                version: 1,
              },
              {
                id: "customer-story",
                kind: "design",
                title: "A customer story",
                difficulty: "medium",
                skills: ["s"],
                sibling: "ownership-story",
                rubric: "story-review",
                statement: "Tell me about a customer.",
                answer: "THE STORY ANSWER",
                hash: "h",
                version: 1,
              },
              {
                id: "quick-idea",
                kind: "design",
                title: "A quick idea",
                difficulty: "easy",
                skills: ["s"],
                sibling: "other-idea",
                rubric: "quick-check",
                statement: "Sketch an idea.",
                answer: "THE IDEA ANSWER",
                hash: "h",
                version: 1,
              },
              {
                id: "pair-sum",
                kind: "coding",
                title: "Pair sum",
                difficulty: "easy",
                skills: ["s"],
                sibling: "other",
                rubric: "design-review",
                statement: "Find two numbers.",
                signature: {
                  function: "pairSum",
                  params: [
                    { name: "nums", type: "int[]" },
                    { name: "target", type: "int" },
                  ],
                  returns: "int[]",
                },
                cases: [],
                hash: "h",
                version: 1,
              },
            ],
          },
        ],
      },
    ],
  } as unknown as ContentResponse;
}

async function render(exerciseId: string, mode?: string) {
  const params = Promise.resolve({
    trackId: "system-design",
    chapterId: "case-studies",
    exerciseId,
  });
  const searchParams = Promise.resolve(mode ? { mode } : {});
  return renderToStaticMarkup(await ExercisePage({ params, searchParams }));
}

const PATH = "/tracks/system-design/chapters/case-studies/exercises";

/** Where the current answer mode tab points */
function currentTab(html: string) {
  const nav = html.slice(html.indexOf('aria-label="Answer mode"'));
  return /<a aria-current="page"[^>]*href="([^"]*)"/.exec(nav)?.[1];
}

describe("exercise page", () => {
  beforeEach(() => {
    api.content = content();
  });

  it("shows the statement and the answer box, but not the model answer", async () => {
    const html = await render("unified-api");
    expect(html).toContain("A unified API");
    expect(html).toContain("Design an API over many providers.");
    expect(html).toContain("Your answer");
    expect(html).toContain("Score my answer");
    expect(html).not.toContain("THE MODEL ANSWER");
    expect(html).not.toContain("<script>");
    expect(html).toContain(
      'href="/tracks/system-design/chapters/case-studies"',
    );
  });

  it("offers practice and rehearsal as tabs, practice first", async () => {
    const html = await render("unified-api");
    expect(html).toContain('aria-label="Answer mode"');
    expect(currentTab(html)).toBe(`${PATH}/unified-api`);
    expect(html).toContain(`href="${PATH}/unified-api?mode=rehearse"`);
    expect(html).not.toContain("Start rehearsal");
  });

  it("rehearses a design case in 45 minutes, apart from practice", async () => {
    const html = await render("unified-api", "rehearse");
    expect(currentTab(html)).toBe(`${PATH}/unified-api?mode=rehearse`);
    expect(html).toContain("Rehearse in 45 minutes");
    expect(html).toContain("Start rehearsal");
    expect(html).toContain("Past rehearsals");
    expect(html).toContain("Design an API over many providers.");
    expect(html).not.toContain("Score my answer");
    expect(html).not.toContain("Write it the way");
    expect(html).not.toContain("THE MODEL ANSWER");
  });

  it("rehearses a story in 5 minutes", async () => {
    const html = await render("customer-story", "rehearse");
    expect(html).toContain("Rehearse in 5 minutes");
    expect(html).not.toContain("THE STORY ANSWER");
  });

  it("has no rehearsal for a rubric without a length", async () => {
    const html = await render("quick-idea", "rehearse");
    expect(html).not.toContain("Answer mode");
    expect(html).not.toContain("Start rehearsal");
    expect(html).toContain("Score my answer");
  });

  it("gives a coding exercise an editor, with no rehearsal", async () => {
    const html = await render("pair-sum", "rehearse");
    expect(html).toContain("Find two numbers.");
    expect(html).toContain("Run tests");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Python");
    expect(html).toContain(
      "export function pairSum(nums: number[], target: number): number[]",
    );
    expect(html).not.toContain("Score my answer");
    expect(html).not.toContain("Answer mode");
  });

  it("is not found for an unknown exercise", async () => {
    await expect(render("nope")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
