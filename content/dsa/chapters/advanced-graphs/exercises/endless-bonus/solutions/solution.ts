export function hasEndlessBonus(
  n: number,
  doors: number[][],
  start: number,
): boolean {
  // coins[room] is the least the player has paid to reach that room so far
  const coins = new Array<number>(n).fill(Infinity);
  coins[start] = 0;
  // n - 1 rounds settle every cheapest path, unless a loop keeps paying
  for (let round = 1; round < n; round++) {
    let changed = false;
    for (const [from, to, toll] of doors) {
      // A room the player can't reach yet can't make anything cheaper
      if (coins[from] !== Infinity && coins[from] + toll < coins[to]) {
        coins[to] = coins[from] + toll;
        changed = true;
      }
    }
    // Nothing moved, so nothing ever will, and no paying loop is in reach
    if (!changed) return false;
  }
  // One more round: a room that still gets cheaper is fed by a paying loop
  for (const [from, to, toll] of doors) {
    if (coins[from] !== Infinity && coins[from] + toll < coins[to]) return true;
  }
  return false;
}
