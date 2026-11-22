class Solution:
    def priceSpans(self, prices: list[int]) -> list[int]:
        spans = []
        # Earlier days that could still end a span, with prices falling from bottom to top
        higher = []
        for day, price in enumerate(prices):
            while higher and prices[higher[-1]] <= price:
                higher.pop()
            # The day left on top is the last one with a higher price
            stop = higher[-1] if higher else -1
            spans.append(day - stop)
            higher.append(day)
        return spans
