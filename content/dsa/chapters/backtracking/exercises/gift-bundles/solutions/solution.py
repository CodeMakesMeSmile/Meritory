class Solution:
    def giftBundles(self, prices: list[int]) -> list[list[int]]:
        # Sorting puts equal prices side by side and keeps each bundle in order
        ordered = sorted(prices)
        bundles = []
        path = []

        def build(start: int) -> None:
            bundles.append(path[:])
            for i in range(start, len(ordered)):
                # A second branch at this level with the same price would repeat the first
                if i > start and ordered[i] == ordered[i - 1]:
                    continue
                path.append(ordered[i])
                build(i + 1)
                path.pop()

        build(0)
        return bundles
