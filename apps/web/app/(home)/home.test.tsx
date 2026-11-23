import type { ContentResponse, RecallDueResponse } from "@meritory/contracts";
import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { prerender } from "react-dom/static";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  content: null as unknown,
  due: null as unknown,
  interview: null as unknown,
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
  getInterviewDate: async () => {
    if (api.interview === "down") throw new Error("GET failed");
    return api.interview;
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

// The API says how many of the new cards today's allowance covers
function counts(chapterId: string, due: number, fresh: number, offered = 0) {
  return {
    trackId: "dsa",
    chapterId,
    due,
    new: fresh,
    offered,
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
  api.interview = null;
});

describe("Home", () => {
  // Two pointers was started first, so a sitting serves its new cards first
  it("lists due chapters in book order, with the new cards the API says each gets", async () => {
    api.due = due({
      newLeftToday: 10,
      chapters: [counts("pointers", 0, 8, 8), counts("arrays", 3, 7, 2)],
    });
    const html = await home();
    expect(html).toContain("Start recall");
    expect(html).toContain("3 to recall, 2 new");
    expect(html).toContain("8 new</span>");
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

describe("Interview line", () => {
  const set = (date: string, status: string) => {
    api.interview = { date, startsOn: null, status, target: 0.9 };
  };

  it("links to Account while the date is coming up", async () => {
    api.due = due({ chapters: [counts("arrays", 2, 0)] });
    set("2026-12-14", "on");
    const html = await home();
    expect(html).toContain("Interview on December 14");
    expect(html).toContain('href="/account"');
    set("2027-01-29", "later");
    expect(await home()).toContain("Interview on January 29");
  });

  it("hides once the date has passed, with no date, or when it can't load", async () => {
    api.due = due({ chapters: [counts("arrays", 2, 0)] });
    set("2026-11-14", "passed");
    expect(await home()).not.toContain("Interview on");
    api.interview = { date: null, startsOn: null, status: "none", target: 0.9 };
    expect(await home()).not.toContain("Interview on");
    api.interview = "down";
    const html = await home();
    expect(html).not.toContain("Interview on");
    expect(html).toContain("Arrays and hashing");
  });
});
