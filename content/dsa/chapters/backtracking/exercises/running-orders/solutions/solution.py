class Solution:
    def runningOrders(self, acts: list[int]) -> list[list[int]]:
        orders = []
        path = []
        used = [False] * len(acts)

        def build() -> None:
            if len(path) == len(acts):
                orders.append(path[:])
                return
            for i in range(len(acts)):
                # Any act not yet on stage can go next
                if used[i]:
                    continue
                used[i] = True
                path.append(acts[i])
                build()
                # Undo both the path and the mark
                path.pop()
                used[i] = False

        build()
        return orders
