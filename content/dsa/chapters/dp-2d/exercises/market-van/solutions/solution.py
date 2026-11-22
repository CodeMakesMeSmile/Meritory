class Solution:
    def bestTakings(self, weights: list[int], takings: list[int], capacity: int) -> int:
        # best[w] is the most takings from the crates so far, weighing at most w
        best = [0] * (capacity + 1)
        for weight, money in zip(weights, takings):
            # Going down keeps best[w - weight] from before this crate, so it's packed once
            for w in range(capacity, weight - 1, -1):
                best[w] = max(best[w], best[w - weight] + money)
        return best[capacity]
