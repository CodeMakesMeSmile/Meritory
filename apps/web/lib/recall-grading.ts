/** A fixed shuffle for one seed, so a card keeps its order while it's on screen */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  // FNV-1a, then a small LCG, so the same seed always gives the same order
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Ordering: steps are numbered by their right place, starting at 0 */
export function orderingIsRight(placed: readonly number[], steps: number) {
  return placed.length === steps && placed.every((step, at) => step === at);
}

/** Where a step belongs, as words for a missed card */
export function ordinal(place: number): string {
  const n = place + 1;
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  return `${n}${suffix[n % 10] ?? "th"}`;
}

/** Matching: every box holds the match its item was written with */
export function matchingIsRight(
  filled: readonly (string | null)[],
  answers: readonly string[],
) {
  return (
    filled.length === answers.length &&
    filled.every((match, at) => match === answers[at])
  );
}
