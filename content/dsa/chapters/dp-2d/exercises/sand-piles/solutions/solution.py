class Solution:
    def cheapestJoin(self, piles: list[int]) -> int:
        n = len(piles)
        # prefix[i] is the weight of the first i piles, so a range's weight is one subtraction
        prefix = [0] * (n + 1)
        for i, weight in enumerate(piles):
            prefix[i + 1] = prefix[i] + weight
        # cost[i][j] is the least fuel to join piles i to j into one, and a single pile costs 0
        cost = [[0] * n for _ in range(n)]
        for length in range(2, n + 1):
            for i in range(n - length + 1):
                j = i + length - 1
                # The last join puts piles i to k together with piles k + 1 to j
                cheapest = min(cost[i][k] + cost[k + 1][j] for k in range(i, j))
                # Whatever the split, the last join weighs the whole range
                cost[i][j] = cheapest + prefix[j + 1] - prefix[i]
        return cost[0][n - 1]
