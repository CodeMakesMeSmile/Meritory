import heapq


class Solution:
    def nearestChargers(self, chargers: list[list[int]], k: int) -> list[list[int]]:
        # Negative squared distances put the farthest of the k nearest so far on top
        nearest = []
        for x, y in chargers:
            heapq.heappush(nearest, (-(x * x + y * y), x, y))
            if len(nearest) > k:
                heapq.heappop(nearest)
        return [[x, y] for _, x, y in nearest]
