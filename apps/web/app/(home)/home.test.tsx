import type { ContentResponse, RecallDueResponse } from "@meritory/contracts";
import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { prerender } from "react-dom/static";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  content: null as unknown,
  due: null as unknown,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, refresh: () => {} }),
  unstable_rethrow: () => {},
}));
vi.mock("@/lib/server-api", () => ({
  requireMe: async () => ({ id: "1", name: "Rowan", email: "a@b.test" }),
  getContent: async () => api.content,
  getDue: async () => {
    if (api.due === "down") throw new Error("GET /v1/recall/due failed");
    if (api.due === "slow") return new Promise(() => {});
    return api.due;
  },
}));

const { default: Home } = await import("./page.tsx");

function chapter(id: string, title: string, order: number) {
  return {
    id,
    title,
    order,
    skills: [{ id: "s", name: "Skill" }],
    explanation: `# ${title}`,
    cards: Array.from({ length: 21 }, (_, i) => ({ id: `c${i}` })),
    exercises: [],
  };
}

function content(arraysTitle = "Arrays and hashing") {
  return {
    hash: "h",
    tracks: [
      {
        id: "dsa",
        title: "Data structures and algorithms",
        chapters: [
          chapter("pointers", "Two pointers", 2),
          chapter("arrays", arraysTitle, 1),
        ],
        rubrics: [],
      },
    ],
  } as unknown as ContentResponse;
}

function counts(chapterId: string, due: number, fresh: number) {
  return {
    trackId: "dsa",
    chapterId,
    due,
    new: fresh,
    learned: 11,
    total: 21,
  };
}

function due(over: Partial<RecallDueResponse> = {}): RecallDueResponse {
  return {
    newLeftToday: 10,
    dueTomorrow: 0,
    overdue: 0,
    dayEndsAt: "2026-11-20T09:00:00.000Z",
    chapters: [],
    ...over,
  };
}

/** The whole page once the counts have streamed in */
async function home() {
  const { prelude } = await prerender(
    await Home({ searchParams: Promise.resolve({}) }),
  );
  // Streaming puts empty comments between text parts
  return (await new Response(prelude).text()).replaceAll("<!-- -->", "");
}

beforeEach(() => {
  api.content = content();
});

describe("Home", () => {
  it("lists due chapters and shares today's new cards in chapter order", async () => {
    api.due = due({
      newLeftToday: 10,
      chapters: [counts("pointers", 0, 8), counts("arrays", 3, 7)],
    });
    const html = await home();
    expect(html).toContain("Start recall");
    expect(html).toContain("3 to recall, 7 new");
    expect(html).toContain("3 new</span>");
    expect(html.indexOf("Arrays and hashing")).toBeLessThan(
      html.indexOf("Two pointers"),
    );
    expect(html).toContain("We add up to 10 new cards a day");
  });

  it("says due cards come first once some are overdue", async () => {
    api.due = due({
      newLeftToday: 0,
      overdue: 1,
      chapters: [counts("arrays", 3, 0)],
    });
    expect(await home()).toContain("Due cards come first, oldest first.");
  });

  it("keeps the new card note when lots are due but none are overdue", async () => {
    api.due = due({ newLeftToday: 0, chapters: [counts("arrays", 48, 0)] });
    const html = await home();
    expect(html).not.toContain("Due cards come first");
    expect(html).toContain("We add up to 10 new cards a day");
  });

  it("shows the page while the counts load, with no false counts", async () => {
    api.due = "slow";
    const html = renderToStaticMarkup(
      await Home({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Due for recall");
    expect(html).toContain("Loading your cards");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Arrays and hashing");
    expect(html).toContain("Read the chapter");
    expect(html).not.toContain("learned");
  });

  it("says new cards arrive tomorrow when nothing comes back", async () => {
    api.due = due({ newLeftToday: 0, chapters: [counts("arrays", 0, 7)] });
    expect(await home()).toContain(
      "You&#x27;ve done today&#x27;s cards. Up to 10 new cards arrive tomorrow.",
    );
  });

  it("sends a new learner to read the first chapter", async () => {
    api.due = due();
    const html = await home();
    expect(html).toContain("Nothing to recall yet");
    expect(html).toContain('href="/tracks/dsa/chapters/arrays"');
    expect(html).toContain("Read Arrays and hashing");
    expect(html).not.toContain("Start recall");
  });

  it("says when cards come back once today's are done", async () => {
    api.due = due({
      newLeftToday: 0,
      dueTomorrow: 4,
      chapters: [counts("arrays", 0, 7)],
    });
    const html = await home();
    expect(html).toContain("Nothing due right now");
    expect(html).toContain("4 come back tomorrow, plus up to 10 new.");
  });

  it("offers Try again when the cards don't load", async () => {
    api.due = "down";
    const html = await home();
    expect(html).toContain("Your cards didn&#x27;t load");
    expect(html).toContain("Try again");
    expect(html).toContain("21 cards learned");
  });

  it("draws learned cards as squares", async () => {
    api.due = due({ chapters: [counts("arrays", 0, 0)] });
    const html = await home();
    expect(html).toContain("11 of 21 cards learned");
    expect(html.match(/size-2 border border-accent bg-accent/g)).toHaveLength(
      11,
    );
  });

  it.each(ATTACKS)("a chapter title of %j renders as text", async (attack) => {
    api.content = content(attack);
    api.due = due({ chapters: [counts("arrays", 2, 0)] });
    const html = await home();
    expect(html).toContain(escapeHtml(attack));
    if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
  });
});
