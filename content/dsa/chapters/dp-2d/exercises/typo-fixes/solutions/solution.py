class Solution:
    def fewestEdits(self, typed: str, word: str) -> int:
        n = len(typed)
        m = len(word)
        # edits[i][j] turns the first i letters of typed into the first j letters of word
        edits = [[0] * (m + 1) for _ in range(n + 1)]
        # From i letters to none is i removals, and from none to j letters is j additions
        for i in range(n + 1):
            edits[i][0] = i
        for j in range(m + 1):
            edits[0][j] = j
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                if typed[i - 1] == word[j - 1]:
                    # The last letters already match, so they cost nothing
                    edits[i][j] = edits[i - 1][j - 1]
                else:
                    # Change the last letter, remove it, or add the word's last letter
                    edits[i][j] = 1 + min(edits[i - 1][j - 1], edits[i - 1][j], edits[i][j - 1])
        return edits[n][m]
