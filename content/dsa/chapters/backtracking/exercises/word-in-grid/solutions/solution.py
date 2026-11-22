class Solution:
    def wordInGrid(self, grid: list[str], word: str) -> bool:
        rows = len(grid)
        cols = len(grid[0])
        used = [[False] * cols for _ in range(rows)]

        def trace(r: int, c: int, at: int) -> bool:
            if at == len(word):
                return True
            if r < 0 or c < 0 or r >= rows or c >= cols:
                return False
            # A used cell or a wrong letter ends this path at once
            if used[r][c] or grid[r][c] != word[at]:
                return False
            used[r][c] = True
            found = (
                trace(r + 1, c, at + 1)
                or trace(r - 1, c, at + 1)
                or trace(r, c + 1, at + 1)
                or trace(r, c - 1, at + 1)
            )
            # Clearing the mark lets other paths use this cell
            used[r][c] = False
            return found

        return any(trace(r, c, 0) for r in range(rows) for c in range(cols))
