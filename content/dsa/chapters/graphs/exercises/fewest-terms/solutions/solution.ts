export function fewestTerms(n: number, prerequisites: number[][]): number {
  const unlocks: number[][] = Array.from({ length: n }, () => []);
  // waiting[m] counts the prerequisites module m hasn't had passed yet
  const waiting = new Array<number>(n).fill(0);
  for (const [before, after] of prerequisites) {
    unlocks[before].push(after);
    waiting[after]++;
  }
  // The first term holds every module with nothing to wait for
  let term: number[] = [];
  for (let m = 0; m < n; m++) if (waiting[m] === 0) term.push(m);
  let terms = 0;
  let taken = 0;
  while (term.length > 0) {
    terms++;
    taken += term.length;
    const nextTerm: number[] = [];
    for (const m of term) {
      for (const after of unlocks[m]) {
        waiting[after]--;
        if (waiting[after] === 0) nextTerm.push(after);
      }
    }
    term = nextTerm;
  }
  // Modules in a circle never get down to 0 waiting, so they're never taken
  return taken === n ? terms : -1;
}
