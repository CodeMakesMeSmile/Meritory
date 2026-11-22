import random


class Solution:
    def kthQuickest(self, times: list[int], k: int) -> int:
        order = list(times)
        want = k - 1
        start, end = 0, len(order) - 1
        while start < end:
            pivot = order[random.randint(start, end)]
            # Split into below, equal to, and above the pivot, as with three sizes
            low, mid, high = start, start, end
            while mid <= high:
                if order[mid] < pivot:
                    order[low], order[mid] = order[mid], order[low]
                    low += 1
                    mid += 1
                elif order[mid] > pivot:
                    order[mid], order[high] = order[high], order[mid]
                    high -= 1
                else:
                    mid += 1
            # Keep going only on the side that holds position k
            if want < low:
                end = low - 1
            elif want > high:
                start = high + 1
            else:
                return pivot
        return order[start]
