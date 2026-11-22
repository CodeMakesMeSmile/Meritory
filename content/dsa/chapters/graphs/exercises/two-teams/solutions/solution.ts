export function twoTeams(n: number, rivals: number[][]): boolean {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of rivals) {
    neighbours[a].push(b);
    neighbours[b].push(a);
  }
  // -1 means no team yet, and otherwise the team is 0 or 1
  const team = new Array<number>(n).fill(-1);
  for (let player = 0; player < n; player++) {
    // Every group of rivals needs its own check, so start a walk from each unplaced player
    if (team[player] !== -1) continue;
    team[player] = 0;
    const stack = [player];
    while (stack.length > 0) {
      const at = stack.pop() as number;
      for (const rival of neighbours[at]) {
        if (team[rival] === -1) {
          team[rival] = 1 - team[at];
          stack.push(rival);
        } else if (team[rival] === team[at]) {
          // Two rivals ended up on the same team, which only a circle of odd length forces
          return false;
        }
      }
    }
  }
  return true;
}
