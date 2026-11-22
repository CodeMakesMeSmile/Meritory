class Solution:
    def flatStretch(self, levels: list[int]) -> int:
        if not levels:
            return 0
        best = run = 1
        for i in range(1, len(levels)):
            run = run + 1 if levels[i] == levels[i - 1] else 1
            # Check on every step, so a stretch that reaches the end still counts
            best = max(best, run)
        return best
