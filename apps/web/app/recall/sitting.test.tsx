import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Card } from "@/lib/content";
import type { SittingCard } from "@/lib/recall-sitting";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));

const { Sitting } = await import("./sitting.tsx");

const NOW = "2026-11-19T15:00:00.000Z";

const lesson = { title: "Slices copy", explanation: "Each slice copies." };
const common = {
  id: "c",
  skill: "s",
  asks: "why",
  prompt: "When should you pass indices?",
  reworded: "Why pass indices instead?",
  lesson,
};

function item(card: Record<string, unknown>, retry = false): SittingCard {
  return {
    key: "dsa/arrays/c",
    chapterTitle: "Arrays and hashing",
    card: { ...common, ...card } as unknown as Card,
    session: {
      trackId: "dsa",
      chapterId: "arrays",
      cardId: "c",
      version: 1,
      isNew: false,
      retry,
      dueAt: NOW,
      next: {
        again: "2026-11-19T15:01:00.000Z",
        hard: "2026-11-19T15:06:00.000Z",
        good: "2026-11-19T15:10:00.000Z",
        easy: "2027-01-12T15:00:00.000Z",
      },
    },
  };
}

const render = (items: SittingCard[]) =>
  renderToStaticMarkup(<Sitting items={items} now={NOW} />);

describe("a recall sitting", () => {
  it("opens a prompt card with Space as a shortcut", () => {
    const html = render([item({ type: "prompt", points: ["Copies"] })]);
    expect(html).toContain("When should you pass indices?");
    expect(html).toContain(
      "Answer in your own words, out loud or typed. A guess still helps.",
    );
    expect(html).toContain("Show key points");
    expect(html).toContain("You can also press Space to show key points.");
    expect(html).toContain("Turn off shortcuts");
    expect(html).toContain("Stop for now");
  });

  it("asks a missed card in other words", () => {
    const html = render([item({ type: "prompt", points: ["Copies"] }, true)]);
    expect(html).toContain("Why pass indices instead?");
    expect(html).not.toContain("When should you pass indices?");
  });

  it("offers pick one as native radios", () => {
    const html = render([
      item({
        type: "pick-one",
        options: [
          { text: "Copies cost time", correct: true, reason: "Right" },
          { text: "Slices are free", reason: "No" },
        ],
      }),
    ]);
    expect(html).toContain("Pick one</legend>");
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toContain('aria-disabled="true"');
  });

  it("lays out steps to place for ordering", () => {
    const html = render([
      item({ type: "ordering", steps: ["Hash", "Reduce", "Look"] }),
    ]);
    expect(html).toContain("Tap the steps from first to last.");
    expect(html).not.toContain("underlined word");
    expect(html).toContain("Still to place");
    expect(html).toContain("Check order");
  });

  it("lays out boxes and choices for matching", () => {
    const html = render([
      item({
        type: "matching",
        matchHeading: "Costs",
        pairs: [
          { item: "Read index i", match: "O(1)" },
          { item: "Search unsorted", match: "O(n)" },
        ],
        extraMatches: ["O(log n)"],
      }),
    ]);
    expect(html).toContain("Tap a box, then the cost that goes in it.");
    expect(html).toContain("Now pick a cost");
    expect(html).toContain("Tap to fill");
    expect(html).toContain("O(log n)");
    expect(html).toContain("Check matches");
  });

  it.each(ATTACKS)("card text of %j renders as text", (attack) => {
    const html = render([
      item({
        type: "matching",
        prompt: attack,
        matchHeading: "Costs",
        pairs: [
          { item: attack, match: "O(1)" },
          { item: "Other", match: attack },
        ],
      }),
    ]);
    expect(html).not.toMatch(/<(script|img|svg|iframe)\b/i);
    expect(html).not.toMatch(/\son\w+=/i);
    expect(html).not.toMatch(/href="(?!#|https:\/\/|\/)/);
    if (!/[<>&"']/.test(attack)) expect(html).toContain(escapeHtml(attack));
  });
});
