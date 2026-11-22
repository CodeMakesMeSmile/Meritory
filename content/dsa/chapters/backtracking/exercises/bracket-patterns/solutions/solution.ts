export function bracketPatterns(pairs: number): string[] {
  const patterns: string[] = [];
  const path: string[] = [];
  const build = (open: number, closed: number): void => {
    if (closed === pairs) {
      patterns.push(path.join(""));
      return;
    }
    // Open another pair only while some are left to open
    if (open < pairs) {
      path.push("(");
      build(open + 1, closed);
      path.pop();
    }
    // Close only when something is open, so the string never goes wrong
    if (closed < open) {
      path.push(")");
      build(open, closed + 1);
      path.pop();
    }
  };
  build(0, 0);
  return patterns;
}
