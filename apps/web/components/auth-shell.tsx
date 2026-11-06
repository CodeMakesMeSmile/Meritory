import type { ReactNode } from "react";
import { LogoLockup } from "./logo";

/** Centred card on graph paper, used by every sign-in page */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="graph-paper flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <LogoLockup />
      <div className="w-full max-w-120 border border-border bg-card p-8">
        {children}
      </div>
    </main>
  );
}
