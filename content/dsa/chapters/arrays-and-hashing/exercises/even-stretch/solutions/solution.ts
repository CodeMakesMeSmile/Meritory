export function evenStretch(games: boolean[]): number {
  // Wins minus losses so far, mapped to the first game index where it happened
  const firstIndex = new Map<number, number>([[0, -1]]);
  let balance = 0;
  let longest = 0;
  for (let i = 0; i < games.length; i++) {
    balance += games[i] ? 1 : -1;
    const start = firstIndex.get(balance);
    if (start === undefined) firstIndex.set(balance, i);
    else longest = Math.max(longest, i - start);
  }
  return longest;
}
