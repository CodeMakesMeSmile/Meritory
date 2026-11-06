import type { ReactNode } from "react";
import { LogoLockup } from "./logo";
import { MarginNote } from "./margin-note";

interface AuthShellProps {
  note: string;
  children: ReactNode;
}

/** Centred card on graph paper, used by every sign-in page */
export function AuthShell({ note, children }: AuthShellProps) {
  return (
    <main className="graph-paper flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <LogoLockup />
      <div className="relative w-full max-w-120 border border-border bg-card p-8">
        <MarginNote>{note}</MarginNote>
        {children}
      </div>
    </main>
  );
}
