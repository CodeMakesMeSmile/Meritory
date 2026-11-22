const MOD = 1_000_000_007;

export function songCount(calls: string, song: string): number {
  const m = song.length;
  // ways[j] counts the ways to spell the first j notes of song from the calls so far
  const ways = new Array<number>(m + 1).fill(0);
  ways[0] = 1;
  for (const call of calls) {
    // Going down keeps ways[j - 1] from before this call, so each call is used once
    for (let j = m; j >= 1; j--) {
      if (song[j - 1] === call) ways[j] = (ways[j] + ways[j - 1]) % MOD;
    }
  }
  return ways[m];
}
