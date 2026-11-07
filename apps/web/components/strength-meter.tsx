import type { Strength } from "@meritory/password";

const FILLED: Record<Strength, { bars: number; color: string }> = {
  weak: { bars: 1, color: "bg-danger" },
  fair: { bars: 2, color: "bg-warning" },
  good: { bars: 3, color: "bg-success" },
  strong: { bars: 4, color: "bg-success" },
};

interface StrengthMeterProps {
  strength: Strength | null;
  message: string;
}

export function StrengthMeter({ strength, message }: StrengthMeterProps) {
  const filled = strength ? FILLED[strength] : { bars: 0, color: "" };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`h-1 flex-1 ${bar < filled.bars ? filled.color : "bg-track"}`}
          />
        ))}
      </div>
      <p className="text-small text-secondary" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
