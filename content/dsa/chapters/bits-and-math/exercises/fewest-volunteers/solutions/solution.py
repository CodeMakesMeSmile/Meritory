class Solution:
    def fewestVolunteers(self, skills: list[int], needed: int) -> int:
        n = len(skills)
        fewest = -1
        # Each mask is one group, with bit i meaning volunteer i is in it
        for mask in range(1 << n):
            covered = 0
            size = 0
            for i in range(n):
                if (mask >> i) & 1:
                    covered |= skills[i]
                    size += 1
            # The group works when every needed bit is also covered
            if covered & needed == needed and (fewest == -1 or size < fewest):
                fewest = size
        return fewest
