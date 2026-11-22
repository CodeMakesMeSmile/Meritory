import heapq

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def gentlestClimb(self, heights: list[list[int]]) -> int:
        rows, cols = len(heights), len(heights[0])
        # strain[r][c] holds the gentlest route to that cell so far
        strain = [[float("inf")] * cols for _ in range(rows)]
        strain[0][0] = 0
        # Each entry is (strain, row, col), with the gentlest on top
        heap = [(0, 0, 0)]
        while heap:
            at, row, col = heapq.heappop(heap)
            # A stale entry, since this cell was already settled by a gentler route
            if at > strain[row][col]:
                continue
            # The first time the far corner comes out, its strain is final
            if row == rows - 1 and col == cols - 1:
                return at
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    # A route's strain is its hardest step, so take the larger instead of adding
                    through = max(at, abs(heights[nr][nc] - heights[row][col]))
                    if through < strain[nr][nc]:
                        strain[nr][nc] = through
                        heapq.heappush(heap, (through, nr, nc))
        return strain[rows - 1][cols - 1]
