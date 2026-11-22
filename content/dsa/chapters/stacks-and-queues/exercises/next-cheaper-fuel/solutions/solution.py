class Solution:
    def nextCheaper(self, prices: list[int]) -> list[int]:
        cheaper = [-1] * len(prices)
        # Days still waiting for a cheaper price, with prices that never fall from bottom to top
        waiting = []
        for day, price in enumerate(prices):
            while waiting and prices[waiting[-1]] > price:
                cheaper[waiting.pop()] = price
            waiting.append(day)
        return cheaper
