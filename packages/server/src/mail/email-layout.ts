import { readFileSync } from "node:fs";
import { colors } from "@meritory/design-tokens";
import type { Mail } from "./mailer.ts";

/** One paragraph of an email, in the order it's read */
export type EmailBlock =
  | { text: string }
  | { note: string }
  | { button: string; url: string }
  | { link: string; url: string };

export interface Email {
  to: string;
  subject: string;
  heading: string;
  blocks: EmailBlock[];
}

export class UnsafeEmailLinkError extends Error {
  constructor() {
    super("Email links must use http or https.");
    this.name = "UnsafeEmailLinkError";
  }
}

const LOGO_LIGHT_CID = "logo-light@meritory";
const LOGO_DARK_CID = "logo-dark@meritory";

/** Attached to every HTML email, so nothing loads from the web on open */
export const EMAIL_LOGOS = [
  {
    filename: "meritory.png",
    content: readFileSync(new URL("./assets/logo-light.png", import.meta.url)),
    cid: LOGO_LIGHT_CID,
  },
  {
    filename: "meritory-dark.png",
    content: readFileSync(new URL("./assets/logo-dark.png", import.meta.url)),
    cid: LOGO_DARK_CID,
  },
];

const PASTE_LABEL = "Or paste this link into your browser:";

// Host Grotesk only loads in Apple Mail, so every client gets its own system font
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const light = colors.light;
const dark = colors.dark;

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeEmailLinkError();
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new UnsafeEmailLinkError();
  }
  return parsed.href;
}

/** Both versions come from one source, so the plain text never drifts */
export function renderEmail(email: Email): Mail {
  return {
    to: email.to,
    subject: email.subject,
    text: renderText(email),
    html: renderHtml(email),
  };
}

function footer(to: string): string {
  return `Sent to ${to} by Meritory.`;
}

function renderText(email: Email): string {
  const parts = [email.heading];
  for (const block of email.blocks) {
    if ("text" in block) parts.push(block.text);
    else if ("note" in block) parts.push(block.note);
    else if ("button" in block)
      parts.push(`${block.button}: ${safeUrl(block.url)}`);
    else parts.push(`${block.link}: ${safeUrl(block.url)}`);
  }
  parts.push(footer(email.to));
  return parts.join("\n\n");
}

// Long addresses have no spaces, and would push the email wider than a phone
const WRAP = "overflow-wrap:anywhere;word-break:break-word";
const BODY = `margin:16px 0 0;${WRAP};font-family:${FONT};font-size:16px;line-height:24px;color:${light.textPrimary}`;
const SMALL = `margin:16px 0 0;${WRAP};font-family:${FONT};font-size:14px;line-height:20px;color:${light.textSecondary}`;

function renderBlock(block: EmailBlock): string {
  if ("text" in block) {
    return `<p class="text" style="${BODY}">${escapeHtml(block.text)}</p>`;
  }
  if ("note" in block) {
    return `<p class="note" style="${SMALL}">${escapeHtml(block.note)}</p>`;
  }
  if ("link" in block) {
    return `<p style="${BODY}"><a class="link" href="${escapeHtml(safeUrl(block.url))}" style="font-weight:600;color:${light.textAccent};text-decoration:none">${escapeHtml(block.link)}</a></p>`;
  }
  const href = escapeHtml(safeUrl(block.url));
  return [
    `<table role="presentation" class="button" width="200" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0;border-collapse:separate">`,
    `<tr><td class="button-fill" align="center" height="44" style="background-color:${light.accentDefault};border-radius:2px">`,
    `<a class="button-label" href="${href}" style="display:block;padding:0 20px;font-family:${FONT};font-size:16px;line-height:44px;font-weight:600;color:${light.textOnAccent};text-decoration:none;text-align:center;border-radius:2px">${escapeHtml(block.button)}</a>`,
    `</td></tr></table>`,
    `<p class="note" style="${SMALL}">${PASTE_LABEL}</p>`,
    `<p style="${SMALL};margin-top:4px;word-break:break-all"><a class="link" href="${href}" style="color:${light.textAccent};text-decoration:none">${href}</a></p>`,
  ].join("\n");
}

// One list of dark colors, written for clients that follow the system theme and again for Outlook.com
const DARK_RULES: [string, string][] = [
  [".page", `background-color:${dark.bgDesk}`],
  [
    ".card",
    `background-color:${dark.bgCard};border-color:${dark.borderDefault}`,
  ],
  [".heading, .text", `color:${dark.textPrimary}`],
  [".note, .footer", `color:${dark.textSecondary}`],
  [".link", `color:${dark.textAccent}`],
  [".button-fill", `background-color:${dark.accentDefault}`],
  [".button-label", `color:${dark.textOnAccent}`],
  [".logo-light", "display:none"],
  [".logo-dark", "display:block;max-height:none;overflow:visible"],
];

function darkCss(prefix: string): string {
  return DARK_RULES.map(([selectors, body]) => {
    const scoped = selectors
      .split(", ")
      .map((s) => `${prefix}${s}`)
      .join(", ");
    const important = body
      .split(";")
      .map((d) => `${d} !important`)
      .join(";");
    return `${scoped} { ${important} }`;
  }).join("\n");
}

function renderHtml(email: Email): string {
  const logo = `width="139" height="44" alt="Meritory" style="display:block;border:0;outline:none"`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(email.subject)}</title>
<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { margin: 0; padding: 0; }
@media (max-width: 480px) {
.page-inner { padding: 40px 16px !important; }
.card { padding: 20px !important; }
.button { width: 100% !important; }
}
@media (prefers-color-scheme: dark) {
${darkCss("")}
}
${darkCss("[data-ogsc] ")}
${darkCss("[data-ogsb] ")}
</style>
</head>
<body class="page" style="margin:0;padding:0;background-color:${light.bgDesk}">
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${light.bgDesk}">
<tr><td class="page-inner" align="center" style="padding:40px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:552px">
<tr><td style="padding:0 0 24px">
<img class="logo-light" src="cid:${LOGO_LIGHT_CID}" ${logo}>
<!--[if !mso]><!--><div class="logo-dark" style="display:none;max-height:0;overflow:hidden"><img src="cid:${LOGO_DARK_CID}" ${logo}></div><!--<![endif]-->
</td></tr>
<tr><td class="card" style="padding:32px;background-color:${light.bgCard};border:1px solid ${light.borderDefault}">
<h1 class="heading" style="margin:0;${WRAP};font-family:${FONT};font-size:22px;line-height:28px;font-weight:600;color:${light.textPrimary}">${escapeHtml(email.heading)}</h1>
${email.blocks.map(renderBlock).join("\n")}
</td></tr>
<tr><td class="footer" style="padding:24px 0 0;${WRAP};font-family:${FONT};font-size:14px;line-height:20px;color:${light.textSecondary}">${escapeHtml(footer(email.to))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
}
