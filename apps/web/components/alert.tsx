import type { ReactNode } from "react";

const TONES = {
  success: "border-success",
  info: "border-border",
} as const;

export function Alert({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <p role="status" className={`border bg-card p-3 text-small ${TONES[tone]}`}>
      {children}
    </p>
  );
}
