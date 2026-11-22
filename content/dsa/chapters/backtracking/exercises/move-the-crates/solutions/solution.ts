export function moveCrates(
  count: number,
  start: number,
  goal: number,
): number[][] {
  const moves: number[][] = [];
  // Moves the top n crates from one bay to another, using the third as a spare
  const move = (n: number, from: number, to: number): void => {
    if (n === 0) return;
    // The bays add up to 6, so the spare is what's left
    const spare = 6 - from - to;
    move(n - 1, from, spare);
    moves.push([from, to]);
    move(n - 1, spare, to);
  };
  move(count, start, goal);
  return moves;
}
