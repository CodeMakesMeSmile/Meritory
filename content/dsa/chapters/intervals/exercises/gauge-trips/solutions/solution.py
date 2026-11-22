class Solution:
    def fewestTrips(self, windows: list[list[int]]) -> int:
        trips = 0
        # The minute of the last trip, before any window opens
        last_trip = -1
        for start, close in sorted(windows, key=lambda window: window[1]):
            # This window opened after the last trip, so that trip missed it
            if start > last_trip:
                trips += 1
                # As late as this window allows, which reads every window open by then
                last_trip = close
        return trips
