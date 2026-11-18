class Solution:
    def pricePair(self, prices: list[int], target: int) -> list[int]:
        first_seen = {}
        for j, price in enumerate(prices):
            partner = first_seen.get(target - price)
            if partner is not None:
                return [partner, j]
            first_seen.setdefault(price, j)
        return []
