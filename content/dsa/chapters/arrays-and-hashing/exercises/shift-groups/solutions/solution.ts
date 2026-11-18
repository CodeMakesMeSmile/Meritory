export function shiftGroups(codes: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const code of codes) {
    // The gaps between neighbouring letters survive any shift
    const gaps: number[] = [];
    for (let i = 1; i < code.length; i++) {
      gaps.push((code.charCodeAt(i) - code.charCodeAt(i - 1) + 26) % 26);
    }
    const key = `${code.length}:${gaps.join(",")}`;
    const group = groups.get(key);
    if (group) group.push(code);
    else groups.set(key, [code]);
  }
  return [...groups.values()];
}
