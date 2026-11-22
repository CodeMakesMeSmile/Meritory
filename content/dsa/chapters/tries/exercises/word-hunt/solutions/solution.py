STEPS = ((1, 0), (-1, 0), (0, 1), (0, -1))


class TrieNode:
    def __init__(self):
        self.children = {}
        # The listed word that ends at this node, until it's found
        self.word = None


class Solution:
    def wordHunt(self, grid: list[str], words: list[str]) -> list[str]:
        root = TrieNode()
        for word in words:
            node = root
            for letter in word:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
            node.word = word
        rows = len(grid)
        cols = len(grid[0])
        used = [[False] * cols for _ in range(rows)]
        found = []

        # Moves into cell (r, c) from the trie node for the letters so far
        def explore(r: int, c: int, node: TrieNode) -> None:
            if used[r][c]:
                return
            following = node.children.get(grid[r][c])
            # No listed word starts with these letters, so stop here
            if following is None:
                return
            if following.word is not None:
                found.append(following.word)
                # Clearing it means a word in two places is reported once
                following.word = None
            used[r][c] = True
            for dr, dc in STEPS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    explore(nr, nc, following)
            # Clearing the mark lets other paths use this cell
            used[r][c] = False

        for r in range(rows):
            for c in range(cols):
                explore(r, c, root)
        return found
