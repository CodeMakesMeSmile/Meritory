class Solution:
    def canSplitEvenly(self, parcels: list[int]) -> bool:
        total = sum(parcels)
        # Two equal whole totals can't add up to an odd number
        if total % 2 == 1:
            return False
        half = total // 2
        # reachable[w] says whether some of the parcels so far weigh exactly w
        reachable = [False] * (half + 1)
        reachable[0] = True
        for weight in parcels:
            # Going down keeps reachable[w - weight] from before this parcel, so it's used once
            for w in range(half, weight - 1, -1):
                if reachable[w - weight]:
                    reachable[w] = True
        return reachable[half]
