export function leastWaiting(repairs: number[]): number {
  // A longer repair just before a shorter one is always worth swapping, so go shortest first
  const quickest = [...repairs].sort((a, b) => a - b);
  let clock = 0;
  let total = 0;
  for (const minutes of quickest) {
    // Each customer waits until their own repair is done
    clock += minutes;
    total += clock;
  }
  return total;
}
