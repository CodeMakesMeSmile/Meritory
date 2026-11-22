class Solution:
    def everyStart(self, depots: list[list[int]]) -> list[int]:
        n = len(depots)
        # salt[i] is the running total of load minus spread over the depots before i
        salt = [0] * (n + 1)
        for i, (load, spread) in enumerate(depots):
            salt[i + 1] = salt[i] + load - spread
        total = salt[n]
        # low_after[s] is the lowest running total from s + 1 up to n
        low_after = [float("inf")] * (n + 1)
        for s in range(n - 1, -1, -1):
            low_after[s] = min(low_after[s + 1], salt[s + 1])
        starts = []
        # The lowest running total from 1 up to s, for the roads after the loop wraps
        low_before = float("inf")
        for s in range(n):
            # From depot s the plough holds salt[j] - salt[s], plus the total once it wraps
            ahead_ok = low_after[s] >= salt[s]
            wrap_ok = s == 0 or total + low_before >= salt[s]
            if ahead_ok and wrap_ok:
                starts.append(s)
            low_before = min(low_before, salt[s + 1])
        return starts
