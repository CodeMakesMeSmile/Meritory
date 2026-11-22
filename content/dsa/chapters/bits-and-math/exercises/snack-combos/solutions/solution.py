class Solution:
    def snackCombos(self, prices: list[int], budget: int) -> int:
        n = len(prices)
        ways = 0
        # Each mask from 1 up is a different non-empty group, with bit i meaning snack i is in
        for mask in range(1, 1 << n):
            total = 0
            for i in range(n):
                if (mask >> i) & 1:
                    total += prices[i]
            if total == budget:
                ways += 1
        return ways
