export function stampSets(values: number[], postage: number): number[][] {
  const sorted = [...values].sort((a, b) => a - b);
  const sets: number[][] = [];
  const path: number[] = [];
  const build = (start: number, left: number): void => {
    if (left === 0) {
      sets.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length; i++) {
      // Every later stamp is worth at least as much, so none of them fit either
      if (sorted[i] > left) break;
      path.push(sorted[i]);
      // Starting at i again lets the same value be used more than once
      build(i, left - sorted[i]);
      path.pop();
    }
  };
  build(0, postage);
  return sets;
}
