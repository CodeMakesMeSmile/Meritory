export function cheapestCuts(length: number, marks: number[]): number {
  // Both ends of the beam and every mark, in order along the beam
  const points = [0, ...[...marks].sort((a, b) => a - b), length];
  const count = points.length;
  // cost[i][j] is the least cost to cut at every mark strictly between points i and j
  const cost = Array.from({ length: count }, () =>
    new Array<number>(count).fill(0),
  );
  // Points next to each other have no mark between them, so those ranges stay at 0
  for (let span = 2; span < count; span++) {
    for (let i = 0; i + span < count; i++) {
      const j = i + span;
      // Try every mark between them as the first cut in this piece
      let cheapest = Infinity;
      for (let k = i + 1; k < j; k++) {
        cheapest = Math.min(cheapest, cost[i][k] + cost[k][j]);
      }
      // The first cut costs the whole piece
      cost[i][j] = cheapest + points[j] - points[i];
    }
  }
  return cost[0][count - 1];
}
