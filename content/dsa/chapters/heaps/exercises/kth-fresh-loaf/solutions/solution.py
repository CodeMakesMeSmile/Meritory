import heapq


class Solution:
    def kthLoaf(self, ovens: list[list[int]], k: int) -> int:
        # Each entry is (minute, oven, position), and the heap holds one front per oven
        fronts = [(oven[0], o, 0) for o, oven in enumerate(ovens) if oven]
        heapq.heapify(fronts)
        # Take the earliest loaf k - 1 times, and the k-th is then on top
        for _ in range(k - 1):
            _, o, at = heapq.heappop(fronts)
            if at + 1 < len(ovens[o]):
                heapq.heappush(fronts, (ovens[o][at + 1], o, at + 1))
        return fronts[0][0]
