export function sharedStart(names: string[]): string {
  const first = names[0];
  // Check one column at a time, and stop where a name runs out or a letter differs
  for (let at = 0; at < first.length; at++) {
    for (const name of names) {
      if (at === name.length || name[at] !== first[at]) {
        return first.slice(0, at);
      }
    }
  }
  return first;
}
