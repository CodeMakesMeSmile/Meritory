class TrieNode {
  children = new Map<string, TrieNode>();
  // The listed word that ends at this node, until it's found
  word: string | undefined = undefined;
}

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function wordHunt(grid: string[], words: string[]): string[] {
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
  const rows = grid.length;
  const cols = grid[0].length;
  const used = grid.map((row) => new Array<boolean>(row.length).fill(false));
  const found: string[] = [];
  // Moves into cell (r, c) from the trie node for the letters so far
  const explore = (r: number, c: number, node: TrieNode): void => {
    if (used[r][c]) return;
    const next = node.children.get(grid[r][c]);
    // No listed word starts with these letters, so stop here
    if (next === undefined) return;
    if (next.word !== undefined) {
      found.push(next.word);
      // Clearing it means a word in two places is reported once
      next.word = undefined;
    }
    used[r][c] = true;
    for (const [dr, dc] of STEPS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) explore(nr, nc, next);
    }
    // Clearing the mark lets other paths use this cell
    used[r][c] = false;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) explore(r, c, root);
  }
  return found;
}
