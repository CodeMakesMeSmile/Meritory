class TrieNode {
  children = new Map<string, TrieNode>();
  // True when a word ends at this node
  isWord = false;
}

export class TileDictionary {
  private root = new TrieNode();

  add(word: string): void {
    let node = this.root;
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

  matches(pattern: string): boolean {
    return this.search(this.root, pattern, 0);
  }

  private search(node: TrieNode, pattern: string, at: number): boolean {
    if (at === pattern.length) return node.isWord;
    const letter = pattern[at];
    if (letter !== ".") {
      const next = node.children.get(letter);
      return next !== undefined && this.search(next, pattern, at + 1);
    }
    // A blank could be any letter, so try every child and stop at the first that works
    for (const child of node.children.values()) {
      if (this.search(child, pattern, at + 1)) return true;
    }
    return false;
  }
}
