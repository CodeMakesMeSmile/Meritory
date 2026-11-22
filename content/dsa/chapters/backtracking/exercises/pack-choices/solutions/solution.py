class Solution:
    def packChoices(self, items: list[int]) -> list[list[int]]:
        sets = []
        path = []

        def build(start: int) -> None:
            # Every path is a set, so save a copy of each one
            sets.append(path[:])
            for i in range(start, len(items)):
                path.append(items[i])
                # Only later items can follow, so each set is built once, in input order
                build(i + 1)
                path.pop()

        build(0)
        return sets
