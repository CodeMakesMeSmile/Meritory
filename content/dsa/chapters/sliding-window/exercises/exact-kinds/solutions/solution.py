class Solution:
    def exactKinds(self, sightings: list[int], k: int) -> int:
        return self.at_most(sightings, k) - self.at_most(sightings, k - 1)

    def at_most(self, sightings: list[int], k: int) -> int:
        counts = {}
        stretches = 0
        left = 0
        for right, kind in enumerate(sightings):
            counts[kind] = counts.get(kind, 0) + 1
            while len(counts) > k:
                counts[sightings[left]] -= 1
                if counts[sightings[left]] == 0:
                    del counts[sightings[left]]
                left += 1
            # Every start from left to right gives a stretch with at most k kinds
            stretches += right - left + 1
        return stretches
