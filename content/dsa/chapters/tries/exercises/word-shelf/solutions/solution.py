class TrieNode:
    def __init__(self):
        self.children = {}
        # True when an added word ends at this node
        self.is_word = False


class WordShelf:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word: str) -> None:
        node = self.root
        for letter in word:
            if letter not in node.children:
                node.children[letter] = TrieNode()
            node = node.children[letter]
        node.is_word = True

    def has(self, word: str) -> bool:
        # The path existing isn't enough, a word must end here
        node = self._walk(word)
        return node is not None and node.is_word

    def hasPrefix(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    # Follows the letters from the root, or returns None if the path stops
    def _walk(self, text: str):
        node = self.root
        for letter in text:
            node = node.children.get(letter)
            if node is None:
                return None
        return node
