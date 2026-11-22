class Solution:
    def cheapestSwims(self, days: list[int], prices: list[int]) -> int:
        last_day = days[-1]
        swims = set(days)
        # spent[d] is the least spent so every planned day up to day d is covered
        spent = [0] * (last_day + 1)
        for d in range(1, last_day + 1):
            if d not in swims:
                # Nothing new to cover today
                spent[d] = spent[d - 1]
                continue
            # A 1, 7, or 30 day pass ending today, plus the best for the days before it
            spent[d] = min(
                spent[d - 1] + prices[0],
                spent[max(0, d - 7)] + prices[1],
                spent[max(0, d - 30)] + prices[2],
            )
        return spent[last_day]
