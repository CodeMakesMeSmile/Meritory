export function primeLockers(lockers: number): number {
  if (lockers < 2) return 0;
  const composite = new Uint8Array(lockers + 1);
  for (let p = 2; p * p <= lockers; p++) {
    if (composite[p]) continue;
    // Smaller multiples of p were already crossed off by smaller primes
    for (let q = p * p; q <= lockers; q += p) composite[q] = 1;
  }
  let count = 0;
  for (let i = 2; i <= lockers; i++) {
    if (!composite[i]) count++;
  }
  return count;
}
