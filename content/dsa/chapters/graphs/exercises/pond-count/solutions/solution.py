STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def pondCount(self, marsh: list[list[int]]) -> int:
        rows, cols = len(marsh), len(marsh[0])
        seen = [[False] * cols for _ in range(rows)]
        ponds = 0
        for r in range(rows):
            for c in range(cols):
                if marsh[r][c] != 1 or seen[r][c]:
                    continue
                # Unseen water starts a new pond, and the walk marks all of it
                ponds += 1
                seen[r][c] = True
                # Our own stack instead of recursion, since one pond can cover the whole marsh
                stack = [(r, c)]
                while stack:
                    row, col = stack.pop()
                    for dr, dc in STEPS:
                        nr, nc = row + dr, col + dc
                        if 0 <= nr < rows and 0 <= nc < cols and marsh[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
        return ponds
