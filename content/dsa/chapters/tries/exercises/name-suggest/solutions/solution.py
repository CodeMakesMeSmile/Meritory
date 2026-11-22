from bisect import bisect_left


class Solution:
    def suggestNames(self, names: list[str], prefix: str, k: int) -> list[str]:
        ordered = sorted(names)
        # Binary search for the first name that's at least the prefix
        start = bisect_left(ordered, prefix)
        # Every name that starts with the prefix sits in one run from there
        found = []
        for i in range(start, min(len(ordered), start + k)):
            if not ordered[i].startswith(prefix):
                break
            found.append(ordered[i])
        return found
