import heapq


class CutoffBoard:
    def __init__(self, k: int, scores: list[int]):
        # Holds the k best scores, with the lowest of them, the cutoff, at best[0]
        self.k = k
        self.best = []
        for score in scores:
            self.add(score)

    def add(self, score: int) -> int:
        if len(self.best) < self.k:
            heapq.heappush(self.best, score)
        elif score > self.best[0]:
            # Swaps the old cutoff out in one step
            heapq.heapreplace(self.best, score)
        return self.best[0]
