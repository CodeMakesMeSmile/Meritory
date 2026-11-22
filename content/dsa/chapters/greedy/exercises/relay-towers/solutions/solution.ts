export function fewestRelays(power: number[]): number {
  const last = power.length - 1;
  let relays = 0;
  // Every tower up to roundEnd can get the message in this many relays
  let roundEnd = 0;
  // The farthest tower one more relay can reach
  let farthest = 0;
  for (let i = 0; i < last; i++) {
    farthest = Math.max(farthest, i + power[i]);
    if (i === roundEnd) {
      // No tower in this round sends any further, so the message is stuck
      if (farthest <= i) return -1;
      relays++;
      roundEnd = farthest;
      if (roundEnd >= last) break;
    }
  }
  return relays;
}
