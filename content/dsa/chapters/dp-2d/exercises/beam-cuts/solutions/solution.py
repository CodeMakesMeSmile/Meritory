class Solution:
    def cheapestCuts(self, length: int, marks: list[int]) -> int:
        # Both ends of the beam and every mark, in order along the beam
        points = [0] + sorted(marks) + [length]
        count = len(points)
        # cost[i][j] is the least cost to cut at every mark strictly between points i and j
        cost = [[0] * count for _ in range(count)]
        # Points next to each other have no mark between them, so those ranges stay at 0
        for span in range(2, count):
            for i in range(count - span):
                j = i + span
                # Try every mark between them as the first cut in this piece
                cheapest = min(cost[i][k] + cost[k][j] for k in range(i + 1, j))
                # The first cut costs the whole piece
                cost[i][j] = cheapest + points[j] - points[i]
        return cost[0][count - 1]
