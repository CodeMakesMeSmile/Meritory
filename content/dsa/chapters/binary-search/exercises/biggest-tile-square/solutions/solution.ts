export function biggestSquare(tiles: number): number {
  // Find the first side whose square needs more than tiles, then step back one
  let lo = 0;
  let hi = tiles + 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid > tiles) hi = mid;
    else lo = mid + 1;
  }
  return lo - 1;
}
