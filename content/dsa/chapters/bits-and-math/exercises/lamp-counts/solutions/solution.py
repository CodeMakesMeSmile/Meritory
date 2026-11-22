class Solution:
    def lampCounts(self, n: int) -> list[int]:
        counts = [0] * (n + 1)
        for i in range(1, n + 1):
            # i & (i - 1) is i with its lowest 1 cleared, a smaller number already counted
            counts[i] = counts[i & (i - 1)] + 1
        return counts
