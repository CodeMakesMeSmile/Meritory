import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ started: false }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
  unstable_rethrow: () => {},
}));
vi.mock("@/lib/server-api", () => ({
  requireMe: async () => ({ id: "1", name: "Rowan", email: "a@b.test" }),
  getContent: async () => ({ hash: "h", tracks: [] }),
  getSession: async () => ({ newLeftToday: 10, cards: [] }),
  getDue: async () => ({
    newLeftToday: 10,
    newCardsPerDay: 10,
    waiting: 0,
    reviewsPerDay: null,
    reviewsLeftToday: null,
    dueTomorrow: 0,
    overdue: 0,
    dayEndsAt: "2026-11-20T09:00:00.000Z",
    chapters: api.started
      ? [
          {
            trackId: "dsa",
            chapterId: "arrays",
            due: 0,
            new: 0,
            learned: 21,
            total: 21,
          },
        ]
      : [],
  }),
}));

const { default: RecallPage } = await import("./page.tsx");

describe("the recall page with nothing to ask", () => {
  it("says today is done once a chapter has started", async () => {
    api.started = true;
    const html = renderToStaticMarkup(await RecallPage());
    expect(html).toContain("Nothing due right now");
    expect(html).toContain("Back to Home");
  });

  it("says how recall starts before any chapter has", async () => {
    api.started = false;
    const html = renderToStaticMarkup(await RecallPage());
    expect(html).toContain("Nothing to recall yet");
    expect(html).not.toContain("today&#x27;s cards");
  });
});
