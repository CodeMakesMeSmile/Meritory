class Solution:
    def mostRuns(self, books: list[int]) -> int:
        runs = 0
        # The farthest place any book in this run has to reach
        reach = 0
        for i, book in enumerate(books):
            reach = max(reach, book)
            # Every book so far belongs at or before here, so the run can end
            if reach == i:
                runs += 1
        return runs
