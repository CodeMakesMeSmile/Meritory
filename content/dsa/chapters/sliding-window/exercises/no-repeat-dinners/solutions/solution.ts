export function noRepeatDinners(dinners: number[], k: number): number {
  const counts = new Map<number, number>();
  // How many dishes appear more than once in the window
  let repeated = 0;
  let stretches = 0;
  for (let right = 0; right < dinners.length; right++) {
    const entering = (counts.get(dinners[right]) ?? 0) + 1;
    counts.set(dinners[right], entering);
    if (entering === 2) repeated++;
    if (right >= k) {
      const dish = dinners[right - k];
      const leaving = (counts.get(dish) ?? 0) - 1;
      counts.set(dish, leaving);
      if (leaving === 1) repeated--;
    }
    if (right >= k - 1 && repeated === 0) stretches++;
  }
  return stretches;
}
