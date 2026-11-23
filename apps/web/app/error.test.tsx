import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/button";
import ErrorPage from "./error.tsx";

/** Finds the Button in the tree, since there's no DOM here to click */
function findButton(node: ReactNode): { onClick?: () => void } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButton(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) {
    return null;
  }
  if (node.type === Button) return node.props;
  if (typeof node.type === "function") {
    const render = node.type as (props: unknown) => ReactNode;
    return findButton(render(node.props));
  }
  return findButton(node.props.children);
}

describe("error page", () => {
  const thrown = new Error("GET /v1/me failed with 503");

  it("says the page didn't load, without the error itself", () => {
    const html = renderToStaticMarkup(
      <ErrorPage error={thrown} retry={() => {}} />,
    );
    expect(html).toContain("Something went wrong");
    expect(html).toContain(
      "We couldn&#x27;t load this page. Try again in a moment.",
    );
    expect(html).toContain("Try again");
    expect(html).not.toContain("503");
  });

  it("tries the page again from Try again", () => {
    const retry = vi.fn();
    findButton(<ErrorPage error={thrown} retry={retry} />)?.onClick?.();
    expect(retry).toHaveBeenCalledOnce();
  });
});
