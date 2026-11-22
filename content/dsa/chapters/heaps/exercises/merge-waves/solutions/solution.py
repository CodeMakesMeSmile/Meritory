import heapq


class Solution:
    def mergeWaves(self, waves: list[list[int]]) -> list[int]:
        # Each entry is (time, wave, position), and the heap holds one front per wave
        fronts = [(wave[0], w, 0) for w, wave in enumerate(waves) if wave]
        heapq.heapify(fronts)
        merged = []
        while fronts:
            time, w, at = heapq.heappop(fronts)
            merged.append(time)
            # The next time in the same wave takes its place
            if at + 1 < len(waves[w]):
                heapq.heappush(fronts, (waves[w][at + 1], w, at + 1))
        return merged
