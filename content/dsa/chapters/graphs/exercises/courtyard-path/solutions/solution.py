from collections import deque

STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def fewestSteps(self, yard: list[list[int]]) -> int:
        rows, cols = len(yard), len(yard[0])
        if yard[0][0] == 1 or yard[rows - 1][cols - 1] == 1:
            return -1
        # steps[r][c] stays -1 until the cell is first reached, which is by the fewest steps
        steps = [[-1] * cols for _ in range(rows)]
        steps[0][0] = 0
        queue = deque([(0, 0)])
        while queue:
            row, col = queue.popleft()
            if row == rows - 1 and col == cols - 1:
                return steps[row][col]
            for dr, dc in STEPS:
                nr, nc = row + dr, col + dc
                # Marking a cell as it joins the queue keeps it from joining twice
                if 0 <= nr < rows and 0 <= nc < cols and yard[nr][nc] == 0 and steps[nr][nc] == -1:
                    steps[nr][nc] = steps[row][col] + 1
                    queue.append((nr, nc))
        return -1
