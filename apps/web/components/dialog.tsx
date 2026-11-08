"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  /** Escape and Cancel both land here */
  onClose: () => void;
  children: ReactNode;
}

/** A modal on the native dialog, so focus stays inside until it closes */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Typing starts in the first field, not on a link above it
      dialog.querySelector<HTMLElement>("input, textarea, select")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-110 border border-border bg-card p-6 text-primary backdrop:bg-desk/80"
    >
      {open && (
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="text-h3">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
