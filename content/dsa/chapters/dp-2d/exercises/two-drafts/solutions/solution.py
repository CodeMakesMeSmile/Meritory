class Solution:
    def fewestDeletions(self, first: str, second: str) -> int:
        n = len(first)
        m = len(second)
        # kept[j] is the longest common subsequence of the first i letters of first and the first j of second
        kept = [0] * (m + 1)
        for i in range(1, n + 1):
            # The entry up and to the left, saved before the update overwrites it
            diagonal = 0
            for j in range(1, m + 1):
                above = kept[j]
                if first[i - 1] == second[j - 1]:
                    kept[j] = diagonal + 1
                else:
                    kept[j] = max(above, kept[j - 1])
                diagonal = above
        # Every letter outside the longest shared part has to go
        return n + m - 2 * kept[m]
