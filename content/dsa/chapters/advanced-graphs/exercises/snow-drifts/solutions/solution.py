from collections import deque

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def fewestDrifts(self, field: list[list[int]]) -> int:
        rows, cols = len(field), len(field[0])
        # Entering a cell costs its own value, and the plough clears its starting cell too
        drifts = [[float("inf")] * cols for _ in range(rows)]
        done = [[False] * cols for _ in range(rows)]
        drifts[0][0] = field[0][0]
        cells = deque([(0, 0)])
        while cells:
            row, col = cells.popleft()
            # A cell can be added more than once, and only its first time out counts
            if done[row][col]:
                continue
            done[row][col] = True
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    cost = field[nr][nc]
                    if drifts[row][col] + cost < drifts[nr][nc]:
                        drifts[nr][nc] = drifts[row][col] + cost
                        # A clear cell costs no more, so it goes to the front, and a drift waits at the back
                        if cost == 0:
                            cells.appendleft((nr, nc))
                        else:
                            cells.append((nr, nc))
        return drifts[rows - 1][cols - 1]
