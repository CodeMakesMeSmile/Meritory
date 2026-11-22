class TrieNode:
    def __init__(self):
        self.children = {}
        # True when a stem ends at this node
        self.is_stem = False


class Solution:
    def shortenWords(self, stems: list[str], sentence: str) -> str:
        root = TrieNode()
        for stem in stems:
            node = root
            for letter in stem:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
            node.is_stem = True

        # Walks down the word and stops at the first stem, which is the shortest
        def shorten(word: str) -> str:
            node = root
            for i, letter in enumerate(word):
                node = node.children.get(letter)
                if node is None:
                    return word
                if node.is_stem:
                    return word[: i + 1]
            return word

        return " ".join(shorten(word) for word in sentence.split(" "))
