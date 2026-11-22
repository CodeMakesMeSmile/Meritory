const MOD = 1_000_000_007n;

export function cultureSize(factor: number, hours: number): number {
  // The count after h hours is the count after half as many hours, squared
  const grow = (h: number): bigint => {
    if (h === 0) return 1n;
    const half = grow(Math.floor(h / 2));
    const squared = (half * half) % MOD;
    // An odd number of hours needs one more split
    return h % 2 === 0 ? squared : (squared * BigInt(factor)) % MOD;
  };
  return Number(grow(hours));
}
