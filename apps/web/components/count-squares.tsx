/** A count drawn as squares: filled for done, outlined for the rest */
export function CountSquares({
  filled,
  total,
  className = "",
}: {
  filled: number;
  total: number;
  className?: string;
}) {
  const done = Math.max(0, Math.min(filled, total));
  return (
    <span aria-hidden="true" className={`flex flex-wrap gap-1 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`size-2 border border-accent ${index < done ? "bg-accent" : ""}`}
        />
      ))}
    </span>
  );
}
