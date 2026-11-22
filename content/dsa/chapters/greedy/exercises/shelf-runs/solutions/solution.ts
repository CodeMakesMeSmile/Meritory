export function mostRuns(books: number[]): number {
  let runs = 0;
  // The farthest place any book in this run has to reach
  let reach = 0;
  for (let i = 0; i < books.length; i++) {
    reach = Math.max(reach, books[i]);
    // Every book so far belongs at or before here, so the run can end
    if (reach === i) runs++;
  }
  return runs;
}
