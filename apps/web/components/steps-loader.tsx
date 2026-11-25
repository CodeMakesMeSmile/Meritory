/** One square of the Steps mark, drawn in all three states so CSS can step between them */
function Step({ x, y, name }: { x: number; y: number; name: string }) {
  const hatch = `M${x + 3} ${y + 7} ${x + 7} ${y + 3}M${x + 3} ${y + 11} ${x + 11} ${y + 3}M${x + 7} ${y + 11} ${x + 11} ${y + 7}`;
  return (
    <g className={`steps-loader-${name}`}>
      <rect
        className="steps-loader-fill"
        x={x}
        y={y}
        width="14"
        height="14"
        fill="currentColor"
      />
      <rect
        className="steps-loader-edge"
        x={x + 1.5}
        y={y + 1.5}
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="steps-loader-hatch"
        d={hatch}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </g>
  );
}

/**
 * The Steps mark inking in square by square while something loads. It waits
 * a second so quick loads don't flash, stops within five seconds, and rests
 * on the logo.
 */
export function StepsLoader({ label }: { label: string }) {
  return (
    <div role="status" className="steps-loader flex items-center gap-4">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-primary"
      >
        <Step x={0} y={34} name="a" />
        <Step x={17} y={17} name="b" />
        <Step x={34} y={0} name="c" />
      </svg>
      <p className="text-small text-secondary">{label}</p>
    </div>
  );
}
