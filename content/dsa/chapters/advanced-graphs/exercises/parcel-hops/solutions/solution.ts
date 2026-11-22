export function cheapestRoute(
  n: number,
  routes: number[][],
  source: number,
  target: number,
  maxStops: number,
): number {
  let price = new Array<number>(n).fill(Infinity);
  price[source] = 0;
  // maxStops stops means maxStops + 1 routes, and each round adds one more route
  for (let round = 0; round <= maxStops; round++) {
    // Read last round's prices and write to a copy, so one round can't chain two routes
    const next = price.slice();
    for (const [from, to, cost] of routes) {
      if (price[from] !== Infinity && price[from] + cost < next[to]) {
        next[to] = price[from] + cost;
      }
    }
    price = next;
  }
  return price[target] === Infinity ? -1 : price[target];
}
