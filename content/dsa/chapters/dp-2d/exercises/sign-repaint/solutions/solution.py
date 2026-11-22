class Solution:
    def cheapestRepaint(
        self, current: str, wanted: str, addCost: int, removeCost: int, repaintCost: int
    ) -> int:
        n = len(current)
        m = len(wanted)
        # before[j] is the cheapest way from the first i - 1 letters of current to the first j of wanted
        # From nothing, every letter of wanted is painted in
        before = [j * addCost for j in range(m + 1)]
        for i in range(1, n + 1):
            # Down to nothing, every letter of current is painted out
            row = [i * removeCost] + [0] * m
            for j in range(1, m + 1):
                if current[i - 1] == wanted[j - 1]:
                    row[j] = before[j - 1]
                else:
                    row[j] = min(
                        before[j - 1] + repaintCost,
                        before[j] + removeCost,
                        row[j - 1] + addCost,
                    )
            before = row
        return before[m]
