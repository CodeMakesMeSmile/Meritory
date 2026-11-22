import heapq


class Solution:
    def fewestRooms(self, sessions: list[list[int]]) -> int:
        # The end time of each room's current session, with the soonest free room on top
        rooms = []
        for start, end in sorted(sessions):
            # Reuse the room that frees up first, if it's free by the time this starts
            if rooms and rooms[0] <= start:
                heapq.heapreplace(rooms, end)
            else:
                heapq.heappush(rooms, end)
        # A room is only ever reused, never given back, so the heap's size is the answer
        return len(rooms)
