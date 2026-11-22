class Solution:
    def canSplit(self, text: str, words: list[str]) -> bool:
        dictionary = set(words)
        longest = max(len(word) for word in words)
        # ok[i] says whether the first i letters split into words
        ok = [False] * (len(text) + 1)
        ok[0] = True
        for i in range(1, len(text) + 1):
            # The last word starts at j, and no word is longer than the longest
            for j in range(max(0, i - longest), i):
                if ok[j] and text[j:i] in dictionary:
                    ok[i] = True
                    break
        return ok[len(text)]
