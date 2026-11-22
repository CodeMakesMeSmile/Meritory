import heapq


class Solution:
    def topScores(self, scores: list[int], k: int) -> list[int]:
        # The lowest of the k best scores so far sits at best[0], ready to be pushed out
        best = []
        for score in scores:
            if len(best) < k:
                heapq.heappush(best, score)
            elif score > best[0]:
                heapq.heapreplace(best, score)
        # Sorting k values is O(k log k), which is within O(n log k)
        return sorted(best, reverse=True)
