class Solution:
    def sharedLandmarks(self, first: list[int], second: list[int]) -> int:
        n = len(first)
        m = len(second)
        # shared[i][j] is the answer for the first i landmarks of first and the first j of second
        shared = [[0] * (m + 1) for _ in range(n + 1)]
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                if first[i - 1] == second[j - 1]:
                    # The two last landmarks match, so they end the list together
                    shared[i][j] = shared[i - 1][j - 1] + 1
                else:
                    # One of the two last landmarks isn't used, so drop one or the other
                    shared[i][j] = max(shared[i - 1][j], shared[i][j - 1])
        return shared[n][m]
