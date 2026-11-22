class TrieNode {
  children = new Map<string, TrieNode>();
  // How many items start with the prefix this node stands for
  passing = 0;
}

export function shortCodes(items: string[]): string[] {
  const root = new TrieNode();
  for (const item of items) {
    let node = root;
    for (const letter of item) {
      let next = node.children.get(letter);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(letter, next);
      }
      next.passing++;
      node = next;
    }
  }
  // The code ends at the first node on the item's path that only this item passes through
  return items.map((item) => {
    let node = root;
    for (let i = 0; i < item.length; i++) {
      node = node.children.get(item[i]) as TrieNode;
      if (node.passing === 1) return item.slice(0, i + 1);
    }
    return item;
  });
}
