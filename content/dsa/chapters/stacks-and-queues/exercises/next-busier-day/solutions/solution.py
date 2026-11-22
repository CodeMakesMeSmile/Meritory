class Solution:
    def daysUntilBusier(self, visitors: list[int]) -> list[int]:
        wait = [0] * len(visitors)
        # Days still waiting for a busier one, with counts that never rise from bottom to top
        waiting = []
        for day, count in enumerate(visitors):
            while waiting and visitors[waiting[-1]] < count:
                earlier = waiting.pop()
                wait[earlier] = day - earlier
            waiting.append(day)
        return wait
