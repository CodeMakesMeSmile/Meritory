import type { SettingsResponse } from "@meritory/contracts";
import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  settings: null as unknown,
  theme: undefined as string | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, refresh: () => {} }),
  unstable_rethrow: () => {},
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (api.theme ? { value: api.theme } : undefined),
  }),
}));
vi.mock("@/lib/server-api", () => ({
  requireMe: async () => ({
    id: "1",
    name: "Rowan",
    email: "a@b.test",
    timeZone: "America/Toronto",
  }),
  getContent: async () => ({
    hash: "h",
    tracks: [
      {
        id: "dsa",
        title: "Data structures and algorithms",
        chapters: [{ id: "arrays", title: "Arrays", order: 1, cards: [] }],
      },
    ],
  }),
  getSettings: async () => api.settings,
}));

const { default: SettingsPage } = await import("./page.tsx");

const SUGGESTED: SettingsResponse["settings"] = {
  newCardsPerDay: 10,
  trackNewLimits: {},
  reviewsPerDay: null,
  recallTarget: 90,
  interviewTarget: 95,
  interviewWeeks: 4,
  dayStartsAt: 4,
  followDeviceTimeZone: true,
  rehearsalMinutes: { designReview: 45, classDesign: 45, storyAnswer: 5 },
  codeLanguage: "typescript",
};

function response(over: Partial<SettingsResponse> = {}): SettingsResponse {
  return {
    settings: SUGGESTED,
    suggested: SUGGESTED,
    timeZone: "America/Toronto",
    interview: { date: null, startsOn: null, status: "none", target: 0.9 },
    ...over,
  };
}

const page = async () =>
  renderToStaticMarkup(await SettingsPage()).replaceAll("<!-- -->", "");

beforeEach(() => {
  api.settings = response();
  api.theme = undefined;
});

describe("Settings", () => {
  it("shows every card at the suggested values", async () => {
    const html = await page();
    for (const title of [
      "Daily recall",
      "Interview date",
      "Practice",
      "On this device",
      "Reset all",
    ]) {
      expect(html).toContain(`>${title}</h2>`);
    }
    expect(html).toMatch(/aria-current="page"[^>]*href="\/settings"/);
    expect(html).toContain(
      "Suggested: 10. At 10, expect around 100 reviews a day once you&#x27;ve settled in.",
    );
    expect(html).toContain("None set. Every track draws from the 10 above.");
    expect(html).toContain("No cap. Every card that&#x27;s due shows up.");
    expect(html).toContain('<option value="4" selected="">4:00 a.m.</option>');
    expect(html).not.toContain("Use suggested");
    expect(html).not.toContain("Remove date");
  });

  it("opens saved track limits and the cap, and offers the suggested value", async () => {
    api.settings = response({
      settings: {
        ...SUGGESTED,
        newCardsPerDay: 20,
        trackNewLimits: { dsa: 0 },
        reviewsPerDay: 150,
        recallTarget: 75,
      },
    });
    const html = await page();
    expect(html).toContain("Use suggested");
    expect(html).toContain(
      "Each limit comes out of the 20 a day. Leave one empty for no limit.",
    );
    expect(html).toContain(
      "Paused. No new data structures and algorithms cards until you change this.",
    );
    expect(html).toContain('value="150"');
    expect(html).toContain("Remove the cap");
    expect(html).toContain(
      "Suggested: 90%. At 75%, you&#x27;ll forget more between reviews, and relearning them adds work.",
    );
  });

  it("names the learner's own targets for a date that's on", async () => {
    api.settings = response({
      settings: { ...SUGGESTED, recallTarget: 85, interviewTarget: 92 },
      interview: {
        date: "2026-12-14",
        startsOn: "2026-11-16",
        status: "on",
        target: 0.92,
      },
    });
    const html = await page();
    expect(html).toContain('value="2026-12-14"');
    expect(html).toContain(
      "On now. Until December 14, cards come back a bit sooner, aiming for 92% recall instead of 85%.",
    );
    expect(html).toContain("Remove date");
  });

  it("shows the theme this browser picked", async () => {
    api.theme = "dark";
    const html = await page();
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="dark"/);
  });

  it("escapes a stored time zone as text", async () => {
    for (const attack of ATTACKS) {
      api.settings = response({
        timeZone: attack,
        settings: { ...SUGGESTED, followDeviceTimeZone: false },
      });
      const html = await page();
      expect(html).toContain(`${escapeHtml(attack)}, picked by you`);
    }
  });
});
