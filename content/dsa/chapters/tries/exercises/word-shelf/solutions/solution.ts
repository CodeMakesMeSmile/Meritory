class TrieNode {
  children = new Map<string, TrieNode>();
  // True when an added word ends at this node
  isWord = false;
}

export class WordShelf {
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

  has(word: string): boolean {
    // The path existing isn't enough, a word must end here
    return this.walk(word)?.isWord === true;
  }

  hasPrefix(prefix: string): boolean {
    return this.walk(prefix) !== undefined;
  }

  // Follows the letters from the root, or returns undefined if the path stops
  private walk(text: string): TrieNode | undefined {
    let node: TrieNode | undefined = this.root;
    for (const letter of text) {
      node = node.children.get(letter);
      if (node === undefined) return undefined;
    }
    return node;
  }
}
