export function letterGroups(words: string[]): string[][] {
  // Map keeps groups in the order their first word was added
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = [...word].sort().join("");
    const group = groups.get(key);
    if (group) group.push(word);
    else groups.set(key, [word]);
  }
  return [...groups.values()];
}
