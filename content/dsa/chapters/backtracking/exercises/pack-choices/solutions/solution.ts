export function packChoices(items: number[]): number[][] {
  const sets: number[][] = [];
  const path: number[] = [];
  const build = (start: number): void => {
    // Every path is a set, so save a copy of each one
    sets.push([...path]);
    for (let i = start; i < items.length; i++) {
      path.push(items[i]);
      // Only later items can follow, so each set is built once, in input order
      build(i + 1);
      path.pop();
    }
  };
  build(0);
  return sets;
}
