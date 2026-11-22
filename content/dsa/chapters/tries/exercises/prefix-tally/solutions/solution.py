class TrieNode:
    def __init__(self):
        self.children = {}
        # How many saved copies pass through this node
        self.passing = 0
        # How many saved copies end at this node
        self.ending = 0


class PrefixTally:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word: str) -> None:
        self._change(word, 1)

    def remove(self, word: str) -> None:
        self._change(word, -1)

    def countStarting(self, prefix: str) -> int:
        node = self._walk(prefix)
        return node.passing if node else 0

    def countExact(self, word: str) -> int:
        node = self._walk(word)
        return node.ending if node else 0

    # Adds by to every count on the word's path, making nodes as needed
    def _change(self, word: str, by: int) -> None:
        node = self.root
        for letter in word:
            if letter not in node.children:
                node.children[letter] = TrieNode()
            node = node.children[letter]
            node.passing += by
        node.ending += by

    # Follows the letters from the root, or returns None if the path stops
    def _walk(self, text: str):
        node = self.root
        for letter in text:
            node = node.children.get(letter)
            if node is None:
                return None
        return node
