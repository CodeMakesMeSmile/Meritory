class Solution:
    def longestQuiet(self, rooms: list[list[int]], opensAt: int, closesAt: int) -> int:
        # Every session from every room, as (start, end)
        sessions = sorted((room[k], room[k + 1]) for room in rooms for k in range(0, len(room), 2))
        longest = 0
        # No room is in use from here until the next session starts
        quiet = opensAt
        for start, end in sessions:
            if start > quiet:
                longest = max(longest, min(start, closesAt) - quiet)
            quiet = max(quiet, end)
            if quiet >= closesAt:
                break
        if quiet < closesAt:
            longest = max(longest, closesAt - quiet)
        return longest
