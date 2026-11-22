class Solution:
    def paintedLength(self, stretches: list[list[int]]) -> int:
        total = 0
        # The merged stretch being built, empty to begin with
        group_start, group_end = -1, -1
        for start, end in sorted(stretches):
            if start > group_end:
                # A gap, so the stretch so far is finished
                total += group_end - group_start
                group_start, group_end = start, end
            else:
                group_end = max(group_end, end)
        return total + group_end - group_start
