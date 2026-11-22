class Solution:
    def mergeBookings(self, bookings: list[list[int]]) -> list[list[int]]:
        merged = []
        for start, end in sorted(bookings):
            # A booking that overlaps or touches the stretch so far joins it
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return merged
