export function sharedLandmarks(first: number[], second: number[]): number {
  const n = first.length;
  const m = second.length;
  // shared[i][j] is the answer for the first i landmarks of first and the first j of second
  const shared = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (first[i - 1] === second[j - 1]) {
        // The two last landmarks match, so they end the list together
        shared[i][j] = shared[i - 1][j - 1] + 1;
      } else {
        // One of the two last landmarks isn't used, so drop one or the other
        shared[i][j] = Math.max(shared[i - 1][j], shared[i][j - 1]);
      }
    }
  }
  return shared[n][m];
}
