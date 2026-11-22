class Solution:
    def mostAboard(self, riders: list[list[int]]) -> int:
        events = []
        for board, leave in riders:
            events.append((board, 1))
            events.append((leave, -1))
        # At the same stop, riders getting off come before riders getting on
        events.sort()
        aboard = 0
        most = 0
        for _, change in events:
            aboard += change
            most = max(most, aboard)
        return most
