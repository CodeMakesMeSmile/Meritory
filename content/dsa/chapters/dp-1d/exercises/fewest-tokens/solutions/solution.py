class Solution:
    def fewestTokens(self, tokens: list[int], fare: int) -> int:
        # fewest[a] is the fewest tokens that make exactly a, or infinity if none do
        fewest = [float("inf")] * (fare + 1)
        fewest[0] = 0
        for a in range(1, fare + 1):
            for token in tokens:
                # The last token could be any value that fits
                if token <= a:
                    fewest[a] = min(fewest[a], fewest[a - token] + 1)
        return -1 if fewest[fare] == float("inf") else int(fewest[fare])
