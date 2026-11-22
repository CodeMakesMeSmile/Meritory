class TrieNode {
  // children[letter - 'a'] is the child for that letter, so they're in letter order
  children: (TrieNode | undefined)[] = new Array(26);
  // The product that ends at this node, if any
  name: string | undefined = undefined;
}

const slot = (letter: string) => letter.charCodeAt(0) - 97;

export function typeAhead(
  products: string[],
  typed: string,
  k: number,
): string[][] {
  const root = new TrieNode();
  for (const product of products) {
    let node = root;
    for (const letter of product) {
      node.children[slot(letter)] ??= new TrieNode();
      node = node.children[slot(letter)] as TrieNode;
    }
    node.name = product;
  }
  // A node's own name comes before every longer name below it, then children go a to z
  const collect = (node: TrieNode, found: string[]): void => {
    if (found.length === k) return;
    if (node.name !== undefined) found.push(node.name);
    for (const child of node.children) {
      if (child !== undefined) collect(child, found);
    }
  };
  const suggestions: string[][] = [];
  let node: TrieNode | undefined = root;
  for (const letter of typed) {
    // Once the walk falls off the trie, nothing typed after can match
    node = node?.children[slot(letter)];
    const found: string[] = [];
    if (node !== undefined) collect(node, found);
    suggestions.push(found);
  }
  return suggestions;
}
