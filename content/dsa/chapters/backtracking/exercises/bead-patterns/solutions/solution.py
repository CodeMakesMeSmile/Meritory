class Solution:
    def beadPatterns(self, beads: list[int]) -> list[list[int]]:
        # Sorting puts beads of the same colour side by side
        ordered = sorted(beads)
        patterns = []
        path = []
        used = [False] * len(ordered)

        def build() -> None:
            if len(path) == len(ordered):
                patterns.append(path[:])
                return
            for i in range(len(ordered)):
                if used[i]:
                    continue
                # Beads of one colour go on from left to right, so swapping them never repeats a pattern
                if i > 0 and ordered[i] == ordered[i - 1] and not used[i - 1]:
                    continue
                used[i] = True
                path.append(ordered[i])
                build()
                path.pop()
                used[i] = False

        build()
        return patterns
