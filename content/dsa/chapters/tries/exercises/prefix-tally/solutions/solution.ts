class TrieNode {
  children = new Map<string, TrieNode>();
  // How many saved copies pass through this node
  passing = 0;
  // How many saved copies end at this node
  ending = 0;
}

export class PrefixTally {
  private root = new TrieNode();

  add(word: string): void {
    this.change(word, 1);
  }

  remove(word: string): void {
    this.change(word, -1);
  }

  countStarting(prefix: string): number {
    return this.walk(prefix)?.passing ?? 0;
  }

  countExact(word: string): number {
    return this.walk(word)?.ending ?? 0;
  }

  // Adds by to every count on the word's path, making nodes as needed
  private change(word: string, by: number): void {
    let node = this.root;
    for (const letter of word) {
      let next = node.children.get(letter);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(letter, next);
      }
      next.passing += by;
      node = next;
    }
    node.ending += by;
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
