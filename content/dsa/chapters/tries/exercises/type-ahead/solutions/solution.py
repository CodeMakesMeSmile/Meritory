class TrieNode:
    def __init__(self):
        self.children = {}
        # The product that ends at this node, if any
        self.name = None


class Solution:
    def typeAhead(self, products: list[str], typed: str, k: int) -> list[list[str]]:
        root = TrieNode()
        for product in products:
            node = root
            for letter in product:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
            node.name = product

        # A node's own name comes before every longer name below it, then children go a to z
        def collect(node: TrieNode, found: list[str]) -> None:
            if len(found) == k:
                return
            if node.name is not None:
                found.append(node.name)
            for letter in sorted(node.children):
                collect(node.children[letter], found)

        suggestions = []
        node = root
        for letter in typed:
            # Once the walk falls off the trie, nothing typed after can match
            node = node.children.get(letter) if node is not None else None
            found = []
            if node is not None:
                collect(node, found)
            suggestions.append(found)
        return suggestions
