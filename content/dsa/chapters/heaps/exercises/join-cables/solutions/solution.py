import heapq


class Solution:
    def joinCables(self, lengths: list[int]) -> int:
        pile = list(lengths)
        heapq.heapify(pile)
        total = 0
        # A joined piece goes back on the pile, since it may still be among the shortest
        while len(pile) > 1:
            joined = heapq.heappop(pile) + heapq.heappop(pile)
            total += joined
            heapq.heappush(pile, joined)
        return total
