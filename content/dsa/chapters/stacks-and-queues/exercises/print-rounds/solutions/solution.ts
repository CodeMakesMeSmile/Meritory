export function finishOrder(pages: number[], k: number): number[] {
  const left = [...pages];
  const queue = pages.map((_, job) => job);
  const finished: number[] = [];
  // A head index stands in for removing from the front, which is O(n) on an array
  for (let head = 0; head < queue.length; head++) {
    const job = queue[head];
    left[job] -= k;
    if (left[job] > 0) queue.push(job);
    else finished.push(job);
  }
  return finished;
}
