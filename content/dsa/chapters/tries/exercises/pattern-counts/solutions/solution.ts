class TrieNode {
  children = new Map<string, TrieNode>();
  // True when a word ends at this node
  isWord = false;
}

export function countFits(words: string[], patterns: string[]): number[] {
  const root = new TrieNode();
  for (const word of words) {
    let node = root;
    for (const letter of word) {
      let next = node.children.get(letter);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(letter, next);
      }
      node = next;
    }
    node.isWord = true;
  }
  // Counts the words below node that fit the pattern from position at on
  const count = (node: TrieNode, pattern: string, at: number): number => {
    if (at === pattern.length) return node.isWord ? 1 : 0;
    const letter = pattern[at];
    if (letter !== ".") {
      const next = node.children.get(letter);
      return next === undefined ? 0 : count(next, pattern, at + 1);
    }
    // An empty square could be any letter, so add up every child's count
    let total = 0;
    for (const child of node.children.values()) {
      total += count(child, pattern, at + 1);
    }
    return total;
  };
  return patterns.map((pattern) => count(root, pattern, 0));
}
