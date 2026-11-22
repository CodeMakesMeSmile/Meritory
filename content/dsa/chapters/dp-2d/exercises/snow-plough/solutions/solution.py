class Solution:
    def fewestMinutes(self, snow: list[list[int]]) -> int:
        rows = len(snow)
        cols = len(snow[0])
        # fewest[r][c] is the quickest lane from the top left to square (r, c), both included
        fewest = [[0] * cols for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                if r == 0 and c == 0:
                    fewest[r][c] = snow[r][c]
                    continue
                # The plough came from above or from the left, and a square off the grid is never picked
                above = fewest[r - 1][c] if r > 0 else float("inf")
                left = fewest[r][c - 1] if c > 0 else float("inf")
                fewest[r][c] = snow[r][c] + min(above, left)
        return fewest[rows - 1][cols - 1]
