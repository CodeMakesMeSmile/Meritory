class Solution:
    def mostScenic(self, n: int, runs: list[list[int]], start: int, goal: int) -> int:
        out = [[] for _ in range(n)]
        waiting = [0] * n
        for hut, nxt, views in runs:
            out[hut].append((nxt, views))
            waiting[nxt] += 1
        # best[hut] is the most views on any way down from start so far, and -1 means not reached
        best = [-1] * n
        best[start] = 0
        # Kahn's algorithm gives an order where every run points later in the order
        order = [hut for hut in range(n) if waiting[hut] == 0]
        for hut in order:
            # Every run into this hut came from earlier in the order, so its best is final
            for nxt, views in out[hut]:
                # Only huts reached from the start can pass on a score
                if best[hut] != -1:
                    best[nxt] = max(best[nxt], best[hut] + views)
                waiting[nxt] -= 1
                if waiting[nxt] == 0:
                    order.append(nxt)
        return best[goal]
