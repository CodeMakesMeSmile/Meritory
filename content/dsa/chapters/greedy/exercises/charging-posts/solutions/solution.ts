export function canReachLast(charge: number[]): boolean {
  // The farthest post any post so far can reach
  let farthest = 0;
  for (let i = 0; i < charge.length; i++) {
    // No earlier post reaches this one, so nothing past it can be reached either
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + charge[i]);
  }
  return true;
}
