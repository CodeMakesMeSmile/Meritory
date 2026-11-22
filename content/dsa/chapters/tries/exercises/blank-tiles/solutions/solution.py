class TrieNode:
    def __init__(self):
        self.children = {}
        # True when a word ends at this node
        self.is_word = False


class TileDictionary:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word: str) -> None:
        node = self.root
        for letter in word:
            if letter not in node.children:
                node.children[letter] = TrieNode()
            node = node.children[letter]
        node.is_word = True

    def matches(self, pattern: str) -> bool:
        return self._search(self.root, pattern, 0)

    def _search(self, node: TrieNode, pattern: str, at: int) -> bool:
        if at == len(pattern):
            return node.is_word
        letter = pattern[at]
        if letter != ".":
            following = node.children.get(letter)
            return following is not None and self._search(following, pattern, at + 1)
        # A blank could be any letter, so try every child and stop at the first that works
        return any(self._search(child, pattern, at + 1) for child in node.children.values())
