class Solution:
    def earliestFinish(self, hours: list[int], needs: list[list[int]]) -> int:
        n = len(hours)
        unlocks = [[] for _ in range(n)]
        waiting = [0] * n
        for before, after in needs:
            unlocks[before].append(after)
            waiting[after] += 1
        # begin[i] is the latest finish of everything task i waits on so far
        begin = [0] * n
        # Kahn's algorithm: a task joins the order once everything it waits on is in it
        order = [task for task in range(n) if waiting[task] == 0]
        last = 0
        for task in order:
            # Everything this task waits on came earlier in the order, so its start is final
            finish = begin[task] + hours[task]
            last = max(last, finish)
            for nxt in unlocks[task]:
                begin[nxt] = max(begin[nxt], finish)
                waiting[nxt] -= 1
                if waiting[nxt] == 0:
                    order.append(nxt)
        return last
