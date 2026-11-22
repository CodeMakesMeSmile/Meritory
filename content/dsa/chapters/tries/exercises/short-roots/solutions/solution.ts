class TrieNode {
  children = new Map<string, TrieNode>();
  // True when a stem ends at this node
  isStem = false;
}

export function shortenWords(stems: string[], sentence: string): string {
  const root = new TrieNode();
  for (const stem of stems) {
    let node = root;
    for (const letter of stem) {
      let next = node.children.get(letter);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(letter, next);
      }
      node = next;
    }
    node.isStem = true;
  }
  // Walks down the word and stops at the first stem, which is the shortest
  const shorten = (word: string): string => {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      const next = node.children.get(word[i]);
      if (next === undefined) return word;
      if (next.isStem) return word.slice(0, i + 1);
      node = next;
    }
    return word;
  };
  return sentence.split(" ").map(shorten).join(" ");
}
