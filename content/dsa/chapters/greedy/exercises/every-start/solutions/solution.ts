export function everyStart(depots: number[][]): number[] {
  const n = depots.length;
  // salt[i] is the running total of load minus spread over the depots before i
  const salt = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    salt[i + 1] = salt[i] + depots[i][0] - depots[i][1];
  }
  const total = salt[n];
  // lowAfter[s] is the lowest running total from s + 1 up to n
  const lowAfter = new Array<number>(n + 1).fill(Number.POSITIVE_INFINITY);
  for (let s = n - 1; s >= 0; s--) {
    lowAfter[s] = Math.min(lowAfter[s + 1], salt[s + 1]);
  }
  const starts: number[] = [];
  // The lowest running total from 1 up to s, for the roads after the loop wraps
  let lowBefore = Number.POSITIVE_INFINITY;
  for (let s = 0; s < n; s++) {
    // From depot s the plough holds salt[j] - salt[s], plus the total once it wraps
    const aheadOk = lowAfter[s] >= salt[s];
    const wrapOk = s === 0 || total + lowBefore >= salt[s];
    if (aheadOk && wrapOk) starts.push(s);
    lowBefore = Math.min(lowBefore, salt[s + 1]);
  }
  return starts;
}
