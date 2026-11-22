import heapq

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def earliestHour(self, field: list[list[int]]) -> int:
        rows, cols = len(field), len(field[0])
        # hour[r][c] holds the earliest the boat can be in that cell so far
        hour = [[float("inf")] * cols for _ in range(rows)]
        # The boat needs water in the starting cell too
        hour[0][0] = field[0][0]
        # Each entry is (hour, row, col), with the earliest on top
        heap = [(field[0][0], 0, 0)]
        while heap:
            at, row, col = heapq.heappop(heap)
            # A stale entry, since this cell was already settled at an earlier hour
            if at > hour[row][col]:
                continue
            # The first time the far corner comes out, its hour is final
            if row == rows - 1 and col == cols - 1:
                return at
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    # The wait is set by the highest cell on the way, so take the larger instead of adding
                    through = max(at, field[nr][nc])
                    if through < hour[nr][nc]:
                        hour[nr][nc] = through
                        heapq.heappush(heap, (through, nr, nc))
        return hour[rows - 1][cols - 1]
