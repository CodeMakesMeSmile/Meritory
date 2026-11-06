import { ATTACKS, escapeHtml } from "@meritory/security-testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/alert";
import { TextField } from "@/components/text-field";

const me = vi.hoisted(() => ({ name: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
}));
vi.mock("@/lib/me", () => ({
  requireMe: async () => ({ id: "1", name: me.name, email: "a@b.test" }),
}));
vi.mock("@/lib/sign-up-email", () => ({ useSignUpEmail: () => me.name }));

const { default: Home } = await import("./page.tsx");
const { SentTo } = await import("./check-email/sent-to.tsx");

/** The attack must show up only in its escaped, harmless form */
function expectEscaped(html: string, attack: string) {
  expect(html).toContain(escapeHtml(attack));
  if (/[<>"']/.test(attack)) expect(html).not.toContain(attack);
}

describe("people's text renders as text", () => {
  it.each(ATTACKS)("a name of %j on the home page", async (attack) => {
    me.name = attack;
    const html = renderToStaticMarkup(await Home());
    expectEscaped(html, attack);
  });

  it.each(ATTACKS)("an email of %j on check your email", (attack) => {
    me.name = attack;
    expectEscaped(renderToStaticMarkup(<SentTo />), attack);
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
