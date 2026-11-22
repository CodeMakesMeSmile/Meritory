class TrieNode {
  children = new Map<string, TrieNode>();
  // The flagged word that ends at this node, until it's found
  word: string | undefined = undefined;
}

export function flaggedWords(message: string, words: string[]): string[] {
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
    node.word = word;
  }
  const found: string[] = [];
  for (let start = 0; start < message.length; start++) {
    // Walk down the trie while the letters match, and a space never has a child
    let node = root.children.get(message[start]);
    for (let at = start + 1; node !== undefined; at++) {
      if (node.word !== undefined) {
        found.push(node.word);
        // Clearing it means a word seen twice is reported once
        node.word = undefined;
      }
      node = at < message.length ? node.children.get(message[at]) : undefined;
    }
  }
  return found;
}
