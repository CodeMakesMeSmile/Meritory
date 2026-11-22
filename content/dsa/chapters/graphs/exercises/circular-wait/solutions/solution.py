from collections import deque


class Solution:
    def hasCircularWait(self, n: int, waits: list[list[int]]) -> bool:
        # A wait [a, b] means b must finish first, so b unlocks a
        unlocks = [[] for _ in range(n)]
        waiting = [0] * n
        for a, b in waits:
            unlocks[b].append(a)
            waiting[a] += 1
        ready = deque(step for step in range(n) if waiting[step] == 0)
        finished = 0
        # Kahn's algorithm: finish a ready step, then free whatever was only waiting on it
        while ready:
            step = ready.popleft()
            finished += 1
            for nxt in unlocks[step]:
                waiting[nxt] -= 1
                if waiting[nxt] == 0:
                    ready.append(nxt)
        # A step in a circle, or behind one, never becomes ready
        return finished < n
