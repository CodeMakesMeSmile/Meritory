class Solution:
    def reopenStretch(self, closures: list[list[int]], reopened: list[int]) -> list[list[int]]:
        cut_from, cut_to = reopened
        left = []
        for start, end in closures:
            # Keep whatever sticks out before the reopened stretch, and after it
            if start < cut_from:
                left.append([start, min(end, cut_from)])
            if end > cut_to:
                left.append([max(start, cut_to), end])
        return left
