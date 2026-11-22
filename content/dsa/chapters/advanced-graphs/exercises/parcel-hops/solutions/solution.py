class Solution:
    def cheapestRoute(
        self, n: int, routes: list[list[int]], source: int, target: int, maxStops: int
    ) -> int:
        price = [float("inf")] * n
        price[source] = 0
        # maxStops stops means maxStops + 1 routes, and each round adds one more route
        for _ in range(maxStops + 1):
            # Read last round's prices and write to a copy, so one round can't chain two routes
            nxt = price[:]
            for sender, receiver, cost in routes:
                if price[sender] + cost < nxt[receiver]:
                    nxt[receiver] = price[sender] + cost
            price = nxt
        return -1 if price[target] == float("inf") else price[target]
