export function smallestVan(parcels: number[], days: number): number {
  // Days a capacity needs when each day takes as many parcels as fit
  const daysAt = (capacity: number): number => {
    let needed = 1;
    let load = 0;
    for (const weight of parcels) {
      if (load + weight > capacity) {
        needed++;
        load = 0;
      }
      load += weight;
    }
    return needed;
  };
  let heaviest = 0;
  let total = 0;
  for (const weight of parcels) {
    heaviest = Math.max(heaviest, weight);
    total += weight;
  }
  // Every capacity before lo is too small, and every one from hi on is enough
  let lo = heaviest;
  let hi = total;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (daysAt(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
