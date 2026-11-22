class TrieNode:
    def __init__(self):
        self.children = {}
        # The flagged word that ends at this node, until it's found
        self.word = None


class Solution:
    def flaggedWords(self, message: str, words: list[str]) -> list[str]:
        root = TrieNode()
        for word in words:
            node = root
            for letter in word:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
            node.word = word
        found = []
        for start in range(len(message)):
            # Walk down the trie while the letters match, and a space never has a child
            node = root
            at = start
            while at < len(message):
                node = node.children.get(message[at])
                if node is None:
                    break
                if node.word is not None:
                    found.append(node.word)
                    # Clearing it means a word seen twice is reported once
                    node.word = None
                at += 1
        return found
