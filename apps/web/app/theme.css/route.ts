import { themeStylesheet } from "@meritory/design-tokens";

export const dynamic = "force-static";

// The layout inlines these tokens with a nonce. The page that stands in for a broken layout has none, so it links here.
export function GET() {
  return new Response(themeStylesheet(), {
    headers: { "content-type": "text/css; charset=utf-8" },
  });
}
