import type { ButtonHTMLAttributes } from "react";

const STYLES = {
  primary: "bg-accent text-on-accent",
  secondary: "border border-border bg-card text-primary",
} as const;

const WAITING_STYLES = {
  primary: "cursor-not-allowed bg-track text-secondary",
  secondary:
    "cursor-not-allowed border border-border-subtle bg-card text-secondary",
} as const;

type Variant = keyof typeof STYLES;

/** Also styles links that look like buttons */
export function buttonClass(variant: Variant = "primary", waiting = false) {
  const look = waiting ? WAITING_STYLES[variant] : STYLES[variant];
  return `focus-ring inline-flex h-control items-center justify-center rounded-control px-5 text-body font-semibold ${look}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /**
   * Greyed out until a countdown ends. It stays focusable, so a screen
   * reader can still read the countdown.
   */
  waiting?: boolean;
}

/** Loading keeps the normal look, so the button doesn't flash grey */
export function Button({
  variant = "primary",
  waiting = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonClass(variant, waiting)} disabled:cursor-progress ${className}`}
      aria-disabled={waiting || undefined}
      {...props}
    />
  );
}

/** Gold text link, at least 24px tall */
export const linkClass = "focus-ring text-link text-gold hover:underline";
