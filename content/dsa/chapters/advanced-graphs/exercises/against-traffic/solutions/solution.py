from collections import deque


class Solution:
    def fewestAgainst(self, n: int, streets: list[list[int]], start: int, goal: int) -> int:
        # Riding the right way costs 0, and walking the wrong way costs 1
        out = [[] for _ in range(n)]
        for a, b in streets:
            out[a].append((b, 0))
            out[b].append((a, 1))
        walked = [float("inf")] * n
        done = [False] * n
        walked[start] = 0
        junctions = deque([start])
        while junctions:
            at = junctions.popleft()
            # A junction can be added more than once, and only its first time out counts
            if done[at]:
                continue
            done[at] = True
            for nxt, cost in out[at]:
                if walked[at] + cost < walked[nxt]:
                    walked[nxt] = walked[at] + cost
                    # Riding costs nothing more, so it goes to the front, and walking waits at the back
                    if cost == 0:
                        junctions.appendleft(nxt)
                    else:
                        junctions.append(nxt)
        return -1 if walked[goal] == float("inf") else walked[goal]
