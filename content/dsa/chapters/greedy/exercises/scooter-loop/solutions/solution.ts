export function firstStart(charge: number[], drain: number[]): number {
  let total = 0;
  let battery = 0;
  let start = 0;
  for (let i = 0; i < charge.length; i++) {
    const gain = charge[i] - drain[i];
    total += gain;
    battery += gain;
    // Ran out before the next dock, so no dock from start to here works either
    if (battery < 0) {
      start = i + 1;
      battery = 0;
    }
  }
  // With enough charge round the whole loop, the last start never runs out
  return total >= 0 ? start : -1;
}
