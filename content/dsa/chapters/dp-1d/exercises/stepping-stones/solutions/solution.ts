export function stoneWays(stones: number): number {
  // Ways to reach the stone two back and the stone one back, starting at stones 0 and 1
  let before = 1;
  let last = 1;
  for (let i = 2; i <= stones; i++) {
    // The last hop came from one stone back or two stones back
    const next = last + before;
    before = last;
    last = next;
  }
  return last;
}
