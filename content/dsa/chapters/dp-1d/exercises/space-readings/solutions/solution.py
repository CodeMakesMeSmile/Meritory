MOD = 1_000_000_007


class Solution:
    def splitCount(self, text: str, words: list[str]) -> int:
        dictionary = set(words)
        longest = max(len(word) for word in words)
        # ways[i] counts the ways to split the first i letters into words
        ways = [0] * (len(text) + 1)
        ways[0] = 1
        for i in range(1, len(text) + 1):
            # Every word that ends here adds the ways to split what comes before it
            for j in range(max(0, i - longest), i):
                if ways[j] and text[j:i] in dictionary:
                    ways[i] = (ways[i] + ways[j]) % MOD
        return ways[len(text)]
