class Solution:
    def smallestVan(self, parcels: list[int], days: int) -> int:
        def days_at(capacity: int) -> int:
            # Days a capacity needs when each day takes as many parcels as fit
            needed = 1
            load = 0
            for weight in parcels:
                if load + weight > capacity:
                    needed += 1
                    load = 0
                load += weight
            return needed

        # Every capacity before lo is too small, and every one from hi on is enough
        lo = max(parcels)
        hi = sum(parcels)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if days_at(mid) <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo
