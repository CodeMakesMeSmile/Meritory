class TrieNode:
    def __init__(self):
        self.children = {}
        # How many words start with the prefix this node stands for
        self.passing = 0


class Solution:
    def prefixScores(self, words: list[str]) -> list[int]:
        root = TrieNode()
        for word in words:
            node = root
            for letter in word:
                if letter not in node.children:
                    node.children[letter] = TrieNode()
                node = node.children[letter]
                node.passing += 1
        # A word's score adds up the counts on its own path
        scores = []
        for word in words:
            node = root
            score = 0
            for letter in word:
                node = node.children[letter]
                score += node.passing
            scores.append(score)
        return scores
