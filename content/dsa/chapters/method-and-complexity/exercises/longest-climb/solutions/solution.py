class Solution:
    def longestClimb(self, heights: list[int]) -> int:
        if not heights:
            return 0
        best = run = 1
        for i in range(1, len(heights)):
            run = run + 1 if heights[i] > heights[i - 1] else 1
            # Check on every step, so a climb that reaches the end still counts
            best = max(best, run)
        return best
