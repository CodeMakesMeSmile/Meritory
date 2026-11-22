class TrieNode:
    def __init__(self):
        self.children = {}
        # How many items start with the prefix this node stands for
        self.passing = 0


class Solution:
    def shortCodes(self, items: list[str]) -> list[str]:
        root = TrieNode()
        for item in items:
            node = root
            for letter in item:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
                node.passing += 1

        # The code ends at the first node on the item's path that only this item passes through
        def code(item: str) -> str:
            node = root
            for i, letter in enumerate(item):
                node = node.children[letter]
                if node.passing == 1:
                    return item[: i + 1]
            return item

        return [code(item) for item in items]
