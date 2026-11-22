export function canSplitEvenly(parcels: number[]): boolean {
  let total = 0;
  for (const weight of parcels) total += weight;
  // Two equal whole totals can't add up to an odd number
  if (total % 2 === 1) return false;
  const half = total / 2;
  // reachable[w] says whether some of the parcels so far weigh exactly w
  const reachable = new Array<boolean>(half + 1).fill(false);
  reachable[0] = true;
  for (const weight of parcels) {
    // Going down keeps reachable[w - weight] from before this parcel, so it's used once
    for (let w = half; w >= weight; w--) {
      if (reachable[w - weight]) reachable[w] = true;
    }
  }
  return reachable[half];
}
