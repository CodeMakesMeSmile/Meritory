from collections import deque


class Solution:
    def fewestRides(self, n: int, routes: list[list[int]], start: int, goal: int) -> int:
        neighbours = [[] for _ in range(n)]
        for a, b in routes:
            neighbours[a].append(b)
            neighbours[b].append(a)
        # rides[i] stays -1 until island i is first reached, which is by the fewest rides
        rides = [-1] * n
        rides[start] = 0
        queue = deque([start])
        while queue:
            at = queue.popleft()
            if at == goal:
                return rides[at]
            for nxt in neighbours[at]:
                # Marking an island as it joins the queue keeps it from joining twice
                if rides[nxt] == -1:
                    rides[nxt] = rides[at] + 1
                    queue.append(nxt)
        return -1
