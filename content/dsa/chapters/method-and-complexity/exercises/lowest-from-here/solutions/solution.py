class Solution:
    def lowestFromHere(self, prices: list[int]) -> list[int]:
        days = []
        # Walk from the end, keeping the lowest price seen after each day
        for i in range(len(prices) - 1, -1, -1):
            if not days or prices[i] < prices[days[-1]]:
                days.append(i)
        # The days were found last to first, and one reverse is O(n)
        days.reverse()
        return days
