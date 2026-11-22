class Solution:
    def readingsOnce(self, readings: list[int]) -> None:
        write = 0
        for read in range(len(readings)):
            # Repeats sit side by side, so compare with the last value kept
            if write == 0 or readings[read] != readings[write - 1]:
                readings[write] = readings[read]
                write += 1
        for i in range(write, len(readings)):
            readings[i] = -1
