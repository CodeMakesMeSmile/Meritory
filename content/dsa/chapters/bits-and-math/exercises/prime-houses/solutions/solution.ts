export function primeHouses(low: number, high: number): number {
  // Every composite in the window has a prime factor no bigger than this
  const root = Math.floor(Math.sqrt(high));
  const small = new Uint8Array(root + 1);
  const primes: number[] = [];
  for (let p = 2; p <= root; p++) {
    if (small[p]) continue;
    primes.push(p);
    for (let q = p * p; q <= root; q += p) small[q] = 1;
  }
  // crossed[i] is set when low + i has a prime factor up to the root
  const crossed = new Uint8Array(high - low + 1);
  for (const p of primes) {
    // Start at p squared, or at the first multiple of p in the window
    const firstMultiple = low + ((p - (low % p)) % p);
    for (let q = Math.max(p * p, firstMultiple); q <= high; q += p) {
      crossed[q - low] = 1;
    }
  }
  let count = 0;
  for (let i = 0; i < crossed.length; i++) {
    // 1 isn't prime, though nothing crosses it off
    if (!crossed[i] && low + i >= 2) count++;
  }
  return count;
}
