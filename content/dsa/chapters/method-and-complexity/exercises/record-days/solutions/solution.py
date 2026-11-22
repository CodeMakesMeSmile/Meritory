class Solution:
    def recordDays(self, highs: list[int]) -> list[int]:
        records = []
        for i, high in enumerate(highs):
            # A record has to beat the best so far, so a tie doesn't count
            if not records or high > highs[records[-1]]:
                records.append(i)
        return records
