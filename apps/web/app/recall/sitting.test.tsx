import type { SittingCard } from "@meritory/recall-client";
import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Card } from "@/lib/content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));

const { ratingsWait, Sitting, UndoBar } = await import("./sitting.tsx");
const { PromptCard } = await import("./prompt-card.tsx");
const { answerRule, Explanation, FeedbackHeading, Lesson } = await import(
  "./parts.tsx"
);
const { PickOneAnswers } = await import("./pick-one-card.tsx");
const { StepOrder } = await import("./ordering-card.tsx");
const { CheckedMatches } = await import("./matching-card.tsx");

const count = (html: string, text: string) => html.split(text).length - 1;

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
        matchHeading: "Cost",
        matchName: "a cost",
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

  // Every match name in the bundle, so the hints read as English for each
  it.each([
    ["Cost", "a cost", "cost"],
    ["Approach", "an approach", "approach"],
    ["Key", "a key", "key"],
  ])("words the %s hints with its own article", (heading, name, bare) => {
    const html = render([
      item({
        type: "matching",
        matchHeading: heading,
        matchName: name,
        pairs: [
          { item: "One", match: "First" },
          { item: "Two", match: "Second" },
        ],
      }),
    ]);
    expect(html).toContain(`Tap a box, then the ${bare} that goes in it.`);
    expect(html).toContain(`Now pick ${name}`);
  });

  it("shows a free-answer card's lesson and fix after Missed", () => {
    const card = {
      ...common,
      type: "prompt",
      points: ["Copies"],
      misconception: "A slice is free.",
      lesson: { ...lesson, fix: "Pass the start and end." },
    } as unknown as Card & { type: "prompt" };
    const html = renderToStaticMarkup(
      <PromptCard
        item={item(card)}
        card={card}
        now={new Date(NOW)}
        checked={{ right: false, encourage: false, wait: "1 minute" }}
        focusOnOpen={false}
        shortcuts
        onToggleShortcuts={() => {}}
        saving={false}
        onRate={() => {}}
        after={<button type="button">Next card</button>}
      />,
    );
    expect(html).toContain("Slices copy");
    expect(html).toContain("You&#x27;ll get another go in 1 minute.");
    expect(html).toContain("Each slice copies.");
    expect(html).toContain("Next time");
    expect(html).toContain("Pass the start and end.");
    expect(html).toContain("Next card");
    expect(html).not.toContain("Common mix-up");
    expect(html).not.toContain("Missed</span>");
  });

  it("puts the fix after the explanation and before the mix-up on a miss", () => {
    const card = {
      ...common,
      type: "pick-one",
      misconception: "A slice is free.",
      lesson: { ...lesson, fix: "Pass the start and end." },
    } as unknown as Card;
    const missed = renderToStaticMarkup(
      <Lesson card={card} missed wait="1 minute" />,
    );
    expect(missed.indexOf("Each slice copies.")).toBeLessThan(
      missed.indexOf("Next time"),
    );
    expect(missed.indexOf("Next time")).toBeLessThan(
      missed.indexOf("Common mix-up"),
    );
    const right = renderToStaticMarkup(
      <Lesson card={card} missed={false} wait="10 minutes" />,
    );
    expect(right).toContain("You&#x27;ll see this again in 10 minutes.");
    expect(right).not.toContain("Next time");
    // A rating the API turned down scheduled nothing, so there's no time to give
    const refused = renderToStaticMarkup(
      <Lesson card={card} missed wait={null} />,
    );
    expect(refused).toContain("Each slice copies.");
    expect(refused).not.toContain("another go");
    expect(refused).not.toContain("see this again");
  });

  it("rules a checked answer red when wrong and green when right", () => {
    expect(answerRule(true)).toBe("border border-danger");
    expect(answerRule(false)).toBe("border border-success");
  });

  it("colours Got it green and leaves Not quite in ink", () => {
    const ref = { current: null };
    const right = renderToStaticMarkup(
      <FeedbackHeading right encourage={false} wait={null} focusRef={ref} />,
    );
    expect(right).toMatch(/<h2[^>]*text-success[^>]*>Got it<\/h2>/);
    const missed = renderToStaticMarkup(
      <FeedbackHeading
        right={false}
        encourage={false}
        wait={null}
        focusRef={ref}
      />,
    );
    expect(missed).toContain(">Not quite</h2>");
    expect(missed).not.toContain("text-success");
  });

  it("rules a right pick green and a missed pick red beside a green answer", () => {
    const pick = { text: "Indices", reason: "No copy", correct: true };
    const wrong = { text: "Slices", reason: "Copies", correct: false };
    const right = renderToStaticMarkup(
      <PickOneAnswers pick={pick} answer={pick} right />,
    );
    expect(count(right, "border-success")).toBe(1);
    expect(right).not.toContain("border-danger");
    expect(right).toMatch(/text-success[^>]*>Your pick</);
    expect(right).not.toContain("Here's the answer");

    const missed = renderToStaticMarkup(
      <PickOneAnswers pick={wrong} answer={pick} right={false} />,
    );
    expect(count(missed, "border-danger")).toBe(1);
    expect(count(missed, "border-success")).toBe(1);
    expect(missed).toMatch(/text-danger[^>]*>Your pick</);
    expect(missed).toMatch(/text-success[^>]*>Here&#x27;s the answer</);
  });

  it("rules each checked step green in place and red out of place", () => {
    const steps = ["Read", "Plan", "Write"];
    const order = (placed: number[], checked = true) =>
      renderToStaticMarkup(
        <StepOrder
          steps={steps}
          placed={placed}
          checked={checked}
          terms={[]}
          onTerm={() => {}}
        />,
      );
    const right = order([0, 1, 2]);
    expect(count(right, "border-success")).toBe(3);
    expect(right).not.toContain("border-danger");

    const missed = order([0, 2, 1]);
    expect(count(missed, "border-success")).toBe(1);
    expect(count(missed, "border-danger")).toBe(2);
    expect(missed).toContain("Goes 3rd");
    expect(missed).toContain("Goes 2nd");

    const building = order([2, 0], false);
    expect(building).not.toMatch(/border-(success|danger)/);
  });

  it("rules each checked match green when right and red with the answer when not", () => {
    const pairs = [
      { item: "Binary search", match: "O(log n)" },
      { item: "One pass", match: "O(n)" },
    ];
    const right = renderToStaticMarkup(
      <CheckedMatches pairs={pairs} filled={["O(log n)", "O(n)"]} />,
    );
    expect(count(right, "border-success")).toBe(2);
    expect(right).not.toContain("border-danger");

    const missed = renderToStaticMarkup(
      <CheckedMatches pairs={pairs} filled={["O(n)", "O(n)"]} />,
    );
    expect(count(missed, "border-success")).toBe(1);
    expect(count(missed, "border-danger")).toBe(1);
    expect(missed).toMatch(/text-danger[^>]*>It&#x27;s /);
  });

  it("shows only the explanation under a missed order or match", () => {
    const card = { ...common, type: "ordering" } as unknown as Card;
    const html = renderToStaticMarkup(<Explanation card={card} />);
    expect(html).toContain("Each slice copies.");
    expect(html).not.toContain("Slices copy");
  });

  it("hides the shortcut hint unless there's a mouse or trackpad", () => {
    const html = render([item({ type: "prompt", points: ["Copies"] })]);
    expect(html).toContain(
      "hidden flex-wrap items-center gap-x-8 any-pointer-fine:flex",
    );
  });

  it("offers Undo with the rating it would undo", () => {
    const html = renderToStaticMarkup(
      <UndoBar
        line={{
          kind: "offer",
          id: "r1",
          rating: "good",
          at: 0,
          busy: false,
          offline: false,
        }}
        onUndo={() => {}}
      />,
    );
    expect(html).toContain("Last card saved as Good.");
    expect(html).toContain('aria-label="Undo the Good rating"');
    expect(html).toContain(">Undo</button>");
    expect(html).toContain('aria-disabled="false"');
  });

  it("keeps Undo to try again when it didn't arrive, and marks it busy while sending", () => {
    const html = renderToStaticMarkup(
      <UndoBar
        line={{
          kind: "offer",
          id: "r1",
          rating: "again",
          at: 0,
          busy: true,
          offline: true,
        }}
        onUndo={() => {}}
      />,
    );
    expect(html).toContain(
      "Undo didn&#x27;t reach us. Check your connection, then try again.",
    );
    expect(html).toContain("text-danger");
    expect(html).toContain('aria-label="Undo the Missed rating"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
  });

  it("holds Undo while a rating saves or after it failed to", () => {
    const html = renderToStaticMarkup(
      <UndoBar
        line={{
          kind: "offer",
          id: "r1",
          rating: "good",
          at: 0,
          busy: false,
          offline: false,
        }}
        locked
        onUndo={() => {}}
      />,
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-busy="true"');
  });

  const offer = (busy: boolean) =>
    ({
      kind: "offer",
      id: "r1",
      rating: "good",
      at: 0,
      busy,
      offline: false,
    }) as const;
  const review = {
    id: "r2",
    card: item({ type: "prompt", points: ["Copies"] }).session,
    rating: "good",
    answeredAt: new Date(NOW),
    durationMs: 1000,
  } as const;

  it.each([
    ["nothing is out", { state: "idle" }, offer(false), false],
    ["a rating saves", { state: "saving" }, null, true],
    [
      "a rating failed to save",
      { state: "failed", review, refused: false },
      null,
      true,
    ],
    [
      "a rating was refused",
      { state: "failed", review, refused: true },
      null,
      true,
    ],
    ["an Undo is out", { state: "idle" }, offer(true), true],
  ] as const)("holds ratings when %s", (_, saving, line, held) => {
    expect(ratingsWait(saving, line)).toBe(held);
  });

  it("drops Undo once the rating is kept", () => {
    const html = renderToStaticMarkup(
      <UndoBar
        line={{ kind: "kept", text: "Undo has run out.", at: 0 }}
        onUndo={() => {}}
      />,
    );
    expect(html).toContain("Undo has run out.");
    expect(html).not.toContain("<button");
  });

  it("shows no Undo line on the first card", () => {
    const html = render([item({ type: "prompt", points: ["Copies"] })]);
    expect(html).not.toContain("Last card saved as");
  });

  it.each(ATTACKS)("card text of %j renders as text", (attack) => {
    const html = render([
      item({
        type: "matching",
        prompt: attack,
        matchHeading: "Cost",
        matchName: "a cost",
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
