import heapq


class Solution:
    def alertTime(self, n: int, links: list[list[int]], start: int) -> int:
        # Links only go one way, so each is listed under the relay that sends it
        out = [[] for _ in range(n)]
        for sender, receiver, delay in links:
            out[sender].append((receiver, delay))
        time = [float("inf")] * n
        time[start] = 0
        # Each entry is (time, relay), with the earliest on top
        heap = [(0, start)]
        while heap:
            at, relay = heapq.heappop(heap)
            # A stale entry, since this relay was already settled at an earlier time
            if at > time[relay]:
                continue
            for nxt, delay in out[relay]:
                if at + delay < time[nxt]:
                    time[nxt] = at + delay
                    heapq.heappush(heap, (time[nxt], nxt))
        # Every relay hears at its own earliest time, so the last one to hear sets the answer
        last = max(time)
        return -1 if last == float("inf") else last
