from collections import deque


class Solution:
    def fewestHops(self, stones: list[int]) -> int:
        last = len(stones) - 1
        # hops[i] stays -1 until stone i is first reached, which is by the fewest hops
        hops = [-1] * len(stones)
        hops[0] = 0
        queue = deque([0])
        while queue:
            at = queue.popleft()
            if at == last:
                return hops[at]
            for nxt in (at + stones[at], at - stones[at]):
                if 0 <= nxt <= last and hops[nxt] == -1:
                    hops[nxt] = hops[at] + 1
                    queue.append(nxt)
        return -1
