"use client";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/button";

// The error itself stays out of the page, since it can name internals
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
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
  );
}
