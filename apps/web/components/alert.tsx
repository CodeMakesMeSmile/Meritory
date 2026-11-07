import type { ReactNode } from "react";

const TONES = {
  success: "border-success",
  info: "border-border",
  danger: "border-danger",
} as const;

export function Alert({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={`border bg-card p-3 text-small ${TONES[tone]}`}
    >
      {children}
    </p>
  );
}
