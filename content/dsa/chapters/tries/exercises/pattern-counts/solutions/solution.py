class TrieNode:
    def __init__(self):
        self.children = {}
        # True when a word ends at this node
        self.is_word = False


class Solution:
    def countFits(self, words: list[str], patterns: list[str]) -> list[int]:
        root = TrieNode()
        for word in words:
            node = root
            for letter in word:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
            node.is_word = True

        # Counts the words below node that fit the pattern from position at on
        def count(node: TrieNode, pattern: str, at: int) -> int:
            if at == len(pattern):
                return 1 if node.is_word else 0
            letter = pattern[at]
            if letter != ".":
                following = node.children.get(letter)
                return 0 if following is None else count(following, pattern, at + 1)
            # An empty square could be any letter, so add up every child's count
            return sum(count(child, pattern, at + 1) for child in node.children.values())

        return [count(root, pattern, 0) for pattern in patterns]
