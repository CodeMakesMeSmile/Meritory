import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The font loader only runs inside Next's build
vi.mock("./fonts", () => ({ FONT_CLASSES: "fonts" }));

const { default: NotFound, metadata } = await import("./not-found.tsx");
const { default: GlobalError } = await import("./global-error.tsx");
const { GET } = await import("./theme.css/route.ts");

describe("page not found", () => {
  it("says so, and offers the way home", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("Page not found");
    expect(html).toContain(
      "This page doesn&#x27;t exist, or it has moved. Check the address, or go back to Home.",
    );
    expect(html).toContain('href="/"');
    expect(html).toContain(">Go to Home</a>");
    expect(metadata.title).toBe("Page not found · Meritory");
  });
});

describe("global error page", () => {
  const thrown = new Error("layout failed with 503");

  it("brings its own page, with no inline styles for the policy to block", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={thrown} retry={() => {}} />,
    );
    expect(html).toContain('<html lang="en" class="fonts">');
    expect(html).toContain('<link rel="stylesheet" href="/theme.css"/>');
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("503");
  });

  it("serves the colour tokens as a stylesheet of our own", async () => {
    const res = GET();
    expect(res.headers.get("content-type")).toBe("text/css; charset=utf-8");
    const css = await res.text();
    expect(css).toContain("--color-bg-card");
    expect(css).toContain("prefers-color-scheme: dark");
  });
});
