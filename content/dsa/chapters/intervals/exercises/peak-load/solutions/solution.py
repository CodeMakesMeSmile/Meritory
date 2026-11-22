class Solution:
    def peakLoad(self, appliances: list[list[int]]) -> int:
        events = []
        for on, off, watts in appliances:
            # Drawing through minute off is the same as stopping as minute off + 1 starts
            events.append((on, watts))
            events.append((off + 1, -watts))
        # At the same minute, switching off comes first
        events.sort()
        load = 0
        peak = 0
        for _, change in events:
            load += change
            peak = max(peak, load)
        return peak
