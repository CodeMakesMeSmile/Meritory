class Solution:
    def stampSets(self, values: list[int], postage: int) -> list[list[int]]:
        ordered = sorted(values)
        sets = []
        path = []

        def build(start: int, left: int) -> None:
            if left == 0:
                sets.append(path[:])
                return
            for i in range(start, len(ordered)):
                # Every later stamp is worth at least as much, so none of them fit either
                if ordered[i] > left:
                    break
                path.append(ordered[i])
                # Starting at i again lets the same value be used more than once
                build(i, left - ordered[i])
                path.pop()

        build(0, postage)
        return sets
