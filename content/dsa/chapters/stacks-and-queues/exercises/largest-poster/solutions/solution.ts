export function largestPoster(boards: number[]): number {
  let best = 0;
  // Positions of boards whose heights rise from bottom to top
  const rising: number[] = [];
  for (let i = 0; i <= boards.length; i++) {
    // A height of 0 past the end pops every board still waiting
    const height = i < boards.length ? boards[i] : 0;
    while (rising.length > 0 && boards[rising[rising.length - 1]] >= height) {
      const top = rising.pop() as number;
      // The board now under it is the nearest shorter one on the left
      const left = rising.length > 0 ? rising[rising.length - 1] : -1;
      best = Math.max(best, boards[top] * (i - left - 1));
    }
    rising.push(i);
  }
  return best;
}
