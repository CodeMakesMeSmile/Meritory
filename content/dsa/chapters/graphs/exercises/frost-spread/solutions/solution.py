from collections import deque

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def hoursToFrost(self, tray: list[list[int]]) -> int:
        rows, cols = len(tray), len(tray[0])
        # hour[r][c] is when the cell frosted over, or -1 while it hasn't
        hour = [[-1] * cols for _ in range(rows)]
        queue = deque()
        healthy = 0
        for r in range(rows):
            for c in range(cols):
                # Every frosted seedling starts in the queue at hour 0, so they all spread together
                if tray[r][c] == 2:
                    hour[r][c] = 0
                    queue.append((r, c))
                elif tray[r][c] == 1:
                    healthy += 1
        latest = 0
        while queue:
            row, col = queue.popleft()
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and tray[nr][nc] == 1 and hour[nr][nc] == -1:
                    hour[nr][nc] = hour[row][col] + 1
                    latest = hour[nr][nc]
                    healthy -= 1
                    queue.append((nr, nc))
        return latest if healthy == 0 else -1
