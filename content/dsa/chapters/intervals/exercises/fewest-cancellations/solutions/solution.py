class Solution:
    def fewestCancellations(self, talks: list[list[int]]) -> int:
        kept = 0
        # The stage is free from this minute on
        free_from = 0
        for start, end in sorted(talks, key=lambda talk: talk[1]):
            # The talk that ends first leaves the most room, so keep each one that fits
            if start >= free_from:
                kept += 1
                free_from = end
        return len(talks) - kept
