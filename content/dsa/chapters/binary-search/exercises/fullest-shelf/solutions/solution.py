class Solution:
    def fullestShelf(self, shelves: list[list[int]]) -> int:
        best = -1
        most_full = 0
        for row, slots in enumerate(shelves):
            # Every slot before lo is empty, and every slot from hi on is full
            lo = 0
            hi = len(slots)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if slots[mid] == 1:
                    hi = mid
                else:
                    lo = mid + 1
            full = len(slots) - lo
            if full > most_full:
                most_full = full
                best = row
        return best
