class Solution:
    def teamFree(self, calendars: list[list[int]], dayStart: int, dayEnd: int) -> list[list[int]]:
        # Every busy time from every calendar, as (start, end)
        busy = sorted(
            (calendar[k], calendar[k + 1]) for calendar in calendars for k in range(0, len(calendar), 2)
        )
        gaps = []
        # Nobody is busy from here until the next busy time starts
        free_from = dayStart
        for start, end in busy:
            if start > free_from:
                gaps.append([free_from, min(start, dayEnd)])
            free_from = max(free_from, end)
            if free_from >= dayEnd:
                break
        if free_from < dayEnd:
            gaps.append([free_from, dayEnd])
        return gaps
