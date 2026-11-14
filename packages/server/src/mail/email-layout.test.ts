import { colors } from "@meritory/design-tokens";
import {
  EMAIL_ATTACKS,
  HTML_ATTACKS,
  URL_ATTACKS,
} from "@meritory/security-testing";
import { describe, expect, it } from "vitest";
import {
  EMAIL_LOGOS,
  type Email,
  escapeHtml,
  renderEmail,
  UnsafeEmailLinkError,
} from "./email-layout.ts";

const email: Email = {
  to: "rowan@meritory.test",
  subject: "Confirm your email for Meritory",
  heading: "Confirm your email",
  blocks: [
    { text: "Finish signing up for Meritory. The link works for 1 hour." },
    { button: "Confirm email", url: "https://meritory.test/verify?token=abc" },
    { link: "Sign in", url: "https://meritory.test/sign-in" },
    { note: "If you didn't sign up, you can ignore this email." },
  ],
};

describe("renderEmail", () => {
  it("writes the plain text from the same blocks", () => {
    expect(renderEmail(email).text).toBe(
      [
        "Confirm your email",
        "Finish signing up for Meritory. The link works for 1 hour.",
        "Confirm email: https://meritory.test/verify?token=abc",
        "Sign in: https://meritory.test/sign-in",
        "If you didn't sign up, you can ignore this email.",
        "Sent to rowan@meritory.test by Meritory.",
      ].join("\n\n"),
    );
  });

  it("puts every block in the HTML, with the link to paste under a button", () => {
    const html = renderEmail(email).html ?? "";
    for (const part of [
      "Confirm your email</h1>",
      ">Confirm email</a>",
      "Or paste this link into your browser:",
      ">https://meritory.test/verify?token=abc</a>",
      'href="https://meritory.test/sign-in"',
      "If you didn&#39;t sign up",
      "Sent to rowan@meritory.test by Meritory.",
    ]) {
      expect(html).toContain(part);
    }
    expect(html.split("Or paste this link").length - 1).toBe(1);
  });

  it("keeps the subject, address, and link out of the HTML unescaped", () => {
    for (const attack of HTML_ATTACKS) {
      const html =
        renderEmail({
          to: attack,
          subject: attack,
          heading: attack,
          blocks: [
            { text: attack },
            { note: attack },
            { button: attack, url: "https://meritory.test/a" },
            { link: attack, url: "https://meritory.test/b" },
          ],
        }).html ?? "";
      expect(html).not.toContain(attack);
      expect(html.split(escapeHtml(attack)).length - 1).toBe(7);
    }
  });

  it("escapes addresses that carry SQL", () => {
    for (const to of EMAIL_ATTACKS) {
      const html = renderEmail({ ...email, to }).html ?? "";
      expect(html).toContain(`Sent to ${escapeHtml(to)} by Meritory.`);
    }
  });

  it("refuses links that aren't http or https", () => {
    const unsafe = URL_ATTACKS.filter((url) => !url.startsWith("https://"));
    for (const url of [...unsafe, "mailto:rowan@meritory.test", ""]) {
      for (const block of [
        { button: "Go", url },
        { link: "Go", url },
      ]) {
        expect(() => renderEmail({ ...email, blocks: [block] })).toThrow(
          UnsafeEmailLinkError,
        );
      }
    }
  });

  it("can't break out of a link with a quote", () => {
    const url = "https://meritory.test/a?x=\"><script>alert(1)</script>'";
    const html =
      renderEmail({ ...email, blocks: [{ link: "Go", url }] }).html ?? "";
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/href="[^"]*"[^ >]/);
  });

  it("swaps to the light logo and own dark colors in dark mode", () => {
    const html = renderEmail(email).html ?? "";
    for (const logo of EMAIL_LOGOS) expect(html).toContain(`cid:${logo.cid}`);
    const dark = html.slice(html.indexOf("prefers-color-scheme: dark"));
    for (const color of [
      colors.dark.bgDesk,
      colors.dark.bgCard,
      colors.dark.textPrimary,
      colors.dark.textAccent,
    ]) {
      expect(dark).toContain(color);
    }
    expect(html).toContain("[data-ogsc] .card");
  });
});

describe("EMAIL_LOGOS", () => {
  it("are PNGs with their own content IDs", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    for (const logo of EMAIL_LOGOS) {
      expect(logo.content.subarray(0, 4)).toEqual(png);
    }
    expect(new Set(EMAIL_LOGOS.map((logo) => logo.cid)).size).toBe(2);
  });
});
