import heapq


class MedianBoard:
    def __init__(self):
        # low holds the smaller half as negatives, so its largest is on top, and high holds the larger half
        self.low = []
        self.high = []

    def record(self, reading: int) -> None:
        # Passing each reading through low keeps every value in low at most every value in high
        heapq.heappush(self.high, -heapq.heappushpop(self.low, -reading))
        # Keep low the same size as high, or one bigger
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self) -> float:
        middle = -self.low[0]
        if len(self.low) > len(self.high):
            return middle
        return (middle + self.high[0]) / 2
