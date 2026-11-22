import heapq


class Solution:
    def mostOnTime(self, orders: list[list[int]]) -> int:
        # The bake times of the orders taken so far, as negatives so the longest is on top
        taken = []
        finish = 0
        for bake, due in sorted(orders, key=lambda order: order[1]):
            heapq.heappush(taken, -bake)
            finish += bake
            # Too late, so drop the longest bake taken, which frees the most oven time
            if finish > due:
                finish += heapq.heappop(taken)
        return len(taken)
