class Solution:
    def bestStretch(self, sales: list[int], k: int) -> int:
        total = 0
        best = 0
        for right in range(len(sales)):
            total += sales[right]
            # Once the window is full, the day k back leaves as this one enters
            if right >= k:
                total -= sales[right - k]
            if right >= k - 1:
                best = max(best, total)
        return best
