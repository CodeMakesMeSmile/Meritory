STEPS = ((1, 0), (-1, 0), (0, 1), (0, -1))


class Solution:
    def mostBerries(self, field: list[list[int]]) -> int:
        rows = len(field)
        cols = len(field[0])

        # Returns the most berries a walk can pick from here on, this bush included
        def walk(r: int, c: int) -> int:
            here = field[r][c]
            # Setting the bush to 0 marks it as picked, so the walk can't come back
            field[r][c] = 0
            best = 0
            for dr, dc in STEPS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and field[nr][nc] > 0:
                    best = max(best, walk(nr, nc))
            # Putting the berries back is the undo
            field[r][c] = here
            return here + best

        most = 0
        for r in range(rows):
            for c in range(cols):
                if field[r][c] > 0:
                    most = max(most, walk(r, c))
        return most
