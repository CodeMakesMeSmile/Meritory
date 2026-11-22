class TrieNode {
  children = new Map<string, TrieNode>();
  // How many words start with the prefix this node stands for
  passing = 0;
}

export function prefixScores(words: string[]): number[] {
  const root = new TrieNode();
  for (const word of words) {
    let node = root;
    for (const letter of word) {
      let next = node.children.get(letter);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(letter, next);
      }
      next.passing++;
      node = next;
    }
  }
  // A word's score adds up the counts on its own path
  return words.map((word) => {
    let node = root;
    let score = 0;
    for (const letter of word) {
      node = node.children.get(letter) as TrieNode;
      score += node.passing;
    }
    return score;
  });
}
