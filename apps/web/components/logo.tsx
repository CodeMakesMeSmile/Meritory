/** The Steps mark: filled, hatched, and empty squares */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <rect
        x="0"
        y="17"
        width="7"
        height="7"
        fill="currentColor"
        stroke="none"
      />
      <rect x="9.25" y="9.25" width="5.5" height="5.5" strokeWidth="1.5" />
      <path d="M10 14 14 10" strokeWidth="1" />
      <rect x="17.75" y="0.75" width="5.5" height="5.5" strokeWidth="1.5" />
    </svg>
  );
}

export function LogoLockup() {
  return (
    <span className="inline-flex items-center gap-2.5 text-primary">
      <LogoMark />
      <span className="text-h2">Meritory</span>
    </span>
  );
}
