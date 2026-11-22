MOD = 1_000_000_007


class Solution:
    def orchardPaths(self, orchard: list[list[int]]) -> int:
        cols = len(orchard[0])
        # Before a row is handled, row[c] holds the paths into the plot above
        row = [0] * cols
        # One path comes into the gate, as if from above
        row[0] = 1
        for plots in orchard:
            for c in range(cols):
                if plots[c] == 1:
                    row[c] = 0
                elif c > 0:
                    # Paths from above are already in row[c], so add the paths from the left
                    row[c] = (row[c] + row[c - 1]) % MOD
        return row[cols - 1]
