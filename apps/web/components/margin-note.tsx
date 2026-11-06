import type { ReactNode } from "react";

/**
 * A short note in the left margin, with a leader that ends in a dot on the
 * edge of the card it explains. Wide screens only.
 */
export function MarginNote({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute top-28 right-full hidden pr-0.5 text-primary xl:block">
      <div className="flex items-end">
        <p className="-mb-2 w-max max-w-60 text-right text-small whitespace-pre-line">
          {children}
        </p>
        <svg
          width="84"
          height="30"
          viewBox="0 0 84 30"
          fill="none"
          className="ml-2"
          aria-hidden="true"
        >
          <path d="M0 29h56L80 3" stroke="currentColor" />
          <circle cx="81.5" cy="2.5" r="2.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
