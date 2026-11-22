export function fewestTokens(tokens: number[], fare: number): number {
  // fewest[a] is the fewest tokens that make exactly a, or Infinity if none do
  const fewest = new Array<number>(fare + 1).fill(Number.POSITIVE_INFINITY);
  fewest[0] = 0;
  for (let a = 1; a <= fare; a++) {
    for (const token of tokens) {
      // The last token could be any value that fits
      if (token <= a) fewest[a] = Math.min(fewest[a], fewest[a - token] + 1);
    }
  }
  return fewest[fare] === Number.POSITIVE_INFINITY ? -1 : fewest[fare];
}
