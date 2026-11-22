class Solution:
    def addBooking(self, diary: list[list[int]], booking: list[int]) -> list[list[int]]:
        result = []
        start, end = booking
        i = 0
        # Busy times that end before the booking starts stay as they are
        while i < len(diary) and diary[i][1] < start:
            result.append(list(diary[i]))
            i += 1
        # Every busy time that overlaps or touches the booking joins it
        while i < len(diary) and diary[i][0] <= end:
            start = min(start, diary[i][0])
            end = max(end, diary[i][1])
            i += 1
        result.append([start, end])
        # The rest start after the booking ends
        result.extend(list(busy) for busy in diary[i:])
        return result
