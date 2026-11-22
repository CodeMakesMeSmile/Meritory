export function bothFree(first: number[][], second: number[][]): number[][] {
  const both: number[][] = [];
  let i = 0;
  let j = 0;
  while (i < first.length && j < second.length) {
    // The two current free times share from the later start to the earlier end
    const start = Math.max(first[i][0], second[j][0]);
    const end = Math.min(first[i][1], second[j][1]);
    if (start < end) both.push([start, end]);
    // Whichever ends first can't share time with anything later in the other list
    if (first[i][1] < second[j][1]) i++;
    else j++;
  }
  return both;
}
