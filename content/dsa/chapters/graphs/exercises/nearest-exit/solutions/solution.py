from collections import deque

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def exitDistances(self, plan: list[list[int]]) -> list[list[int]]:
        rows, cols = len(plan), len(plan[0])
        # Walls and cells no exit reaches keep -1
        distance = [[-1] * cols for _ in range(rows)]
        queue = deque()
        for r in range(rows):
            for c in range(cols):
                # Every exit starts in the queue at 0, so each cell is first reached from its nearest exit
                if plan[r][c] == 2:
                    distance[r][c] = 0
                    queue.append((r, c))
        while queue:
            row, col = queue.popleft()
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and plan[nr][nc] == 0 and distance[nr][nc] == -1:
                    distance[nr][nc] = distance[row][col] + 1
                    queue.append((nr, nc))
        return distance
