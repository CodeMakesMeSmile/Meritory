# Tries

A trie, said like "try", is a tree for storing words so that words with the same start share the same path. Each step down the tree is one letter, so every node stands for a prefix, and the root stands for the empty prefix. To find a word, read it a letter at a time and follow the matching child.

A hash set from the arrays and hashing chapter already says whether a whole word is there. What it can't do is answer questions about prefixes, like "which words start with `ca`?", without checking every word it holds. A trie answers those by walking down one letter at a time, so the cost depends on the length of the prefix, not on how many words are stored.

## How a trie stores words

Here's a trie holding car, care, cart, and dog. A `*` marks a node where a word ends.

```text
root
  c
    a
      r *
        e *
        t *
  d
    o
      g *
```

The words car, care, and cart share the c, a, and r nodes, so those letters are stored once.

**The end of word mark.** The node for `ca` exists, because car passes through it, but ca isn't a word. Each node needs a flag that says whether a word ends there. Without it, a search for ca would say yes. And car is a word even though its node has children, so "has no children" can't stand in for the mark either.

**The children.** Each node keeps its children in one of two ways.

| Children kept in | Good for | Cost |
|---|---|---|
| A map from letter to node | Any alphabet, and only the children that exist take memory | A map lookup per letter |
| An array of 26 slots, one per letter | Lowercase a to z, found by `letter - 'a'` | 26 slots on every node, even when most are empty |

The array is the usual choice in Java and C when the words are lowercase letters. In TypeScript and Python, a map or a dict reads more naturally. Either way, a node in TypeScript can be this small.

```ts
class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}
```

## Insert, search, and starts with

All three walk down from the root one letter at a time.

- **Insert.** Follow each letter, creating the child when it's missing. At the last letter, set the mark.
- **Search.** Follow each letter. If a child is missing, the word isn't there. At the end, the answer is the mark, not just "the path exists".
- **Starts with.** The same walk as search, but reaching the end of the prefix is enough, mark or no mark.

```ts
function walk(root: TrieNode, text: string): TrieNode | undefined {
  let node: TrieNode | undefined = root;
  for (const letter of text) {
    node = node.children.get(letter);
    if (node === undefined) return undefined;
  }
  return node;
}

const search = (word: string) => walk(root, word)?.isWord === true;
const startsWith = (prefix: string) => walk(root, prefix) !== undefined;
```

Each one takes O(L) steps for a word of length L, however many words the trie holds. The memory is at most one node per letter inserted, and less when words share prefixes.

## Counting words by prefix

To count the words that start with a prefix, keep a `count` on each node: how many inserted words pass through it. Insert adds 1 to every node on the word's path, and the count for a prefix is the count on its node, or 0 if the walk falls off the trie. That's O(L) per question, with no walk through the words below.

Decide up front what a repeated insert means. If the same word can be added twice and should count twice, keep a second number, `ends`, for how many copies end at the node, in place of a true or false mark. Removing one copy is then the same walk, taking 1 off each count and off `ends` at the last node.

Adding up the counts along a word's path answers a different question: for each prefix of the word, how many words share it.

## Autocomplete in sorted order

To suggest up to k words that start with a prefix, walk to the prefix's node, then search the part of the trie below it depth first, as in the trees chapter. Visit the children in letter order, from a to z, and record a node's word before going into its children. That preorder lists the words in alphabetical order, because a word comes before every longer word that starts with it, like car before cart, and the children in letter order keep the rest sorted. Stop as soon as k words are found.

With an array of 26 slots, the children are already in letter order. With a map, sort the child letters at each node, or keep them sorted as they're added.

If the word list never changes, a sorted list does the same job. Binary search for the first word that's at least the prefix, as in the binary search chapter, then read forward while the words still start with the prefix, up to k of them. The trie wins when words keep being added, or when every letter typed asks a new question, since each new letter is one step down from the last node.

## Wildcards with backtracking

Some searches use a wildcard, like `.` matching any one letter. At an ordinary letter, there's one child to follow. At a `.`, any child could be the right one, so try each in turn and stop as soon as one leads to a match. That's the choose and explore pattern from the backtracking chapter.

```ts
function matches(node: TrieNode, pattern: string, at: number): boolean {
  if (at === pattern.length) return node.isWord;
  const letter = pattern[at];
  if (letter !== ".") {
    const next = node.children.get(letter);
    return next !== undefined && matches(next, pattern, at + 1);
  }
  for (const child of node.children.values()) {
    if (matches(child, pattern, at + 1)) return true;
  }
  return false;
}
```

The recursion goes one level per letter of the pattern, so it's only as deep as the pattern is long. A pattern of all dots may visit every node at that depth, but the trie only holds paths that exist, so the search never wanders into letter combinations no word has.

To count matches instead, add up what every branch returns and keep a count of the words ending at each node.

## The longest common prefix

The longest prefix every word shares doesn't need a trie. Compare the words letter by letter, column by column, and stop at the first column where a letter differs or a word runs out. That's O(total letters).

With a trie of the words, the same answer is the path from the root that stays single. Walk down while the node has exactly one child and no word ends there. The second check matters: with car and cart, the walk must stop after car, because car ends there even though the node has one child.

**The shortest prefix that picks out one word.** With counts on the nodes, walk down a word until the count drops to 1. That prefix is shared by no other word in the list, so it's the shortest code that names the word.

## Many words at once

The backtracking chapter traced one word through a grid of letters. To find which of many words appear, running that search once per word repeats work, since words like cart and care share their first three steps.

Put the words in a trie, then start a walk from every cell, moving down the trie as the walk moves through the grid. Step to a neighbouring cell only if the current trie node has a child for that cell's letter, so a path that isn't the start of any word stops at once. When the walk reaches a node with the mark, record that word. Mark each grid cell on the way in and clear it on the way out, as before.

```ts
function explore(r: number, c: number, node: TrieNode, path: string): void {
  const next = node.children.get(grid[r][c]);
  if (next === undefined || used[r][c]) return;
  const word = path + grid[r][c];
  if (next.isWord) {
    found.push(word);
    next.isWord = false; // report each word once
  }
  used[r][c] = true;
  for (const [dr, dc] of steps) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) explore(nr, nc, next, word);
  }
  used[r][c] = false;
}
```

Clearing the mark once a word is found means it's reported once, even if the grid holds it in several places. The recursion is only as deep as the longest word, since a path can't go further than the trie does.

The same idea works on plain text. Start at each position and walk down the trie for as long as the letters match, recording every mark you pass. One pass from each start finds every word that begins there, all at once.

## Trie, hash set, or sorted list

| The question | A good fit |
|---|---|
| Is this exact word in the list? | A hash set |
| How many words start with this prefix, asked many times? | A trie with counts |
| The first k words with a prefix, from a list that never changes | A sorted list and binary search, or a trie |
| Does any word match a pattern with wildcards? | A trie and backtracking |
| Which of many words appear in a grid or a text? | A trie walked alongside the search |

A trie isn't free. Every node is an object, and with 26 slots each it can take many times the memory of the words themselves. When a hash set or a sorted list answers the question, it's usually the simpler choice.

Before you start, ask about the edges: an empty prefix, a word that's also a prefix of another word, the same word added twice, fewer than k matches, and which letters can appear.
