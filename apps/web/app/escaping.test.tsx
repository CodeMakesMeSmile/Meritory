import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/alert";
import { TextField } from "@/components/text-field";
import { ProfileCard } from "./account/profile-card.tsx";

const me = vi.hoisted(() => ({ name: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, refresh: () => {} }),
  unstable_rethrow: () => {},
}));
vi.mock("@/lib/server-api", () => ({
  requireMe: async () => ({ id: "1", name: me.name, email: "a@b.test" }),
  getContent: async () => ({ hash: "h", tracks: [] }),
  getDue: async () => ({
    newLeftToday: 10,
    newCardsPerDay: 10,
    waiting: 0,
    reviewsPerDay: null,
    reviewsLeftToday: null,
    dueTomorrow: 0,
    overdue: 0,
    dayEndsAt: "2026-11-20T09:00:00.000Z",
    chapters: [],
  }),
  getInterviewDate: async () => null,
}));
vi.mock("@/lib/sign-up-email", () => ({ useSignUpEmail: () => me.name }));

const { default: Home } = await import("./(home)/page.tsx");
const { SentTo } = await import("./check-email/sent-to.tsx");

const home = (params: Record<string, string> = {}) =>
  Home({ searchParams: Promise.resolve(params) });

/** The attack must show up only in its escaped, harmless form */
function expectEscaped(html: string, attack: string) {
  expect(html).toContain(escapeHtml(attack));
  if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
}

describe("people's text renders as text", () => {
  it.each(ATTACKS)("a name of %j on the home page", async (attack) => {
    me.name = attack;
    const html = renderToStaticMarkup(await home());
    expectEscaped(html, attack);
  });

  it.each(ATTACKS)("a linked value of %j on the home page", async (attack) => {
    me.name = "Rowan";
    const html = renderToStaticMarkup(await home({ linked: attack }));
    expect(html).not.toContain("is now linked");
    if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
  });

  it("says GitHub was just linked, under the heading", async () => {
    me.name = "Rowan";
    const html = renderToStaticMarkup(await home({ linked: "github" }));
    const note = html.indexOf("GitHub is now linked to your account.");
    expect(note).toBeGreaterThan(html.indexOf("Due for recall</h1>"));
  });

  it.each(ATTACKS)("an email of %j on check your email", (attack) => {
    me.name = attack;
    expectEscaped(renderToStaticMarkup(<SentTo />), attack);
  });

  it.each(ATTACKS)("a name and email of %j on Account", (attack) => {
    const html = renderToStaticMarkup(
      <ProfileCard name={attack} email={attack} />,
    );
    expect(html).toContain(`value="${escapeHtml(attack)}"`);
    expect(html).toContain(`break-all">${escapeHtml(attack)}</span>`);
    if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
  });

  it.each(ATTACKS)("a message of %j in an alert", (attack) => {
    expectEscaped(
      renderToStaticMarkup(<Alert tone="danger">{attack}</Alert>),
      attack,
    );
  });

  it.each(ATTACKS)("a value and error of %j in a field", (attack) => {
    const html = renderToStaticMarkup(
      <TextField
        id="email"
        label="Email"
        error={attack}
        defaultValue={attack}
      />,
    );
    // Once in the value attribute and once in the error text
    expect(html.split(escapeHtml(attack)).length - 1).toBe(2);
    if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
  });
});
