import type { ButtonHTMLAttributes } from "react";

const STYLES = {
  primary: "bg-accent text-on-accent",
  secondary: "border border-border bg-card text-primary",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof STYLES;
}

/** Loading keeps the normal look, so the button doesn't flash grey */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex h-control items-center justify-center rounded-control px-5 text-body font-semibold disabled:cursor-progress ${STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

/** Gold text link, at least 24px tall */
export const linkClass = "focus-ring text-link text-gold hover:underline";
