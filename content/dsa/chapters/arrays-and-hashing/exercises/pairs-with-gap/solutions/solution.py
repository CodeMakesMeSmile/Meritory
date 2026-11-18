class Solution:
    def pairsWithGap(self, scores: list[int], gap: int) -> int:
        counts = {}
        pairs = 0
        for score in scores:
            pairs += counts.get(score - gap, 0)
            if gap != 0:
                pairs += counts.get(score + gap, 0)
            counts[score] = counts.get(score, 0) + 1
        return pairs
