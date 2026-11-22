import heapq


class Solution:
    def runningMedians(self, times: list[int]) -> list[float]:
        # low holds the shorter half as negatives, so its longest is on top, and high holds the longer half
        low = []
        high = []
        medians = []
        for time in times:
            # Passing each time through low keeps every value in low at most every value in high
            heapq.heappush(high, -heapq.heappushpop(low, -time))
            # Keep low the same size as high, or one bigger
            if len(high) > len(low):
                heapq.heappush(low, -heapq.heappop(high))
            middle = -low[0]
            medians.append(middle if len(low) > len(high) else (middle + high[0]) / 2)
        return medians
