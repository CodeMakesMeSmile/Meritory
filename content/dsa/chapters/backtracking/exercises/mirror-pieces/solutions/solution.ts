export function mirrorSplits(word: string): string[][] {
  const ways: string[][] = [];
  const path: string[] = [];
  const readsBothWays = (from: number, to: number): boolean => {
    for (let i = from, j = to; i < j; i++, j--) {
      if (word[i] !== word[j]) return false;
    }
    return true;
  };
  const build = (start: number): void => {
    if (start === word.length) {
      ways.push([...path]);
      return;
    }
    for (let end = start; end < word.length; end++) {
      // A piece that doesn't mirror can't be part of any answer
      if (!readsBothWays(start, end)) continue;
      path.push(word.slice(start, end + 1));
      build(end + 1);
      path.pop();
    }
  };
  build(0);
  return ways;
}
