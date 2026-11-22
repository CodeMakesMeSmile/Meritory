// The most brightness from glow[from] to glow[to - 1] in a straight row
function bestInRow(glow: number[], from: number, to: number): number {
  let before = 0;
  let best = 0;
  for (let i = from; i < to; i++) {
    const next = Math.max(best, before + glow[i]);
    before = best;
    best = next;
  }
  return best;
}

export function brightestRing(glow: number[]): number {
  if (glow.length === 1) return glow[0];
  // The first and last are neighbours, so leave out one of them each time
  return Math.max(
    bestInRow(glow, 0, glow.length - 1),
    bestInRow(glow, 1, glow.length),
  );
}
