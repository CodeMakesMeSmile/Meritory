"use client";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/button";
import { FONT_CLASSES } from "./fonts";
import "./globals.css";

// Stands in for the whole layout when the layout itself fails, so it brings its own html and styles
export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en" className={FONT_CLASSES}>
      <head>
        <title>Something went wrong · Meritory</title>
        <link rel="stylesheet" href="/theme.css" />
      </head>
      <body className="font-sans antialiased">
        <AuthShell>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="text-display">Something went wrong</h1>
              <p className="text-body text-secondary">
                We couldn't load this page. Try again in a moment.
              </p>
            </div>
            <Button type="button" className="w-full" onClick={() => retry()}>
              Try again
            </Button>
          </div>
        </AuthShell>
      </body>
    </html>
  );
}
