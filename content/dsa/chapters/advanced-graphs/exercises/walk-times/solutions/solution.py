import heapq


class Solution:
    def walkTimes(self, n: int, paths: list[list[int]], start: int) -> list[int]:
        # Footpaths go both ways, so each is listed under both stalls
        out = [[] for _ in range(n)]
        for a, b, minutes in paths:
            out[a].append((b, minutes))
            out[b].append((a, minutes))
        time = [float("inf")] * n
        time[start] = 0
        # Each entry is (minutes, stall), with the quickest on top
        heap = [(0, start)]
        while heap:
            at, stall = heapq.heappop(heap)
            # A stale entry, since this stall was already settled by a quicker walk
            if at > time[stall]:
                continue
            for nxt, minutes in out[stall]:
                if at + minutes < time[nxt]:
                    time[nxt] = at + minutes
                    heapq.heappush(heap, (time[nxt], nxt))
        return [-1 if t == float("inf") else t for t in time]
