class Solution:
    def voucherBaskets(self, prices: list[int], voucher: int) -> list[list[int]]:
        # Sorting puts equal prices side by side and keeps each basket in order
        ordered = sorted(prices)
        baskets = []
        path = []

        def build(start: int, left: int) -> None:
            if left == 0:
                baskets.append(path[:])
                return
            for i in range(start, len(ordered)):
                # Every later price is at least as high, so none of them fit either
                if ordered[i] > left:
                    break
                # A second branch at this level with the same price would repeat the first
                if i > start and ordered[i] == ordered[i - 1]:
                    continue
                path.append(ordered[i])
                # Starting after i uses each item at most once
                build(i + 1, left - ordered[i])
                path.pop()

        build(0, voucher)
        return baskets
