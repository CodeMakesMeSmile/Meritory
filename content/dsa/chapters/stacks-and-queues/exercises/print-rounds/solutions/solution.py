from collections import deque


class Solution:
    def finishOrder(self, pages: list[int], k: int) -> list[int]:
        left = list(pages)
        queue = deque(range(len(pages)))
        finished = []
        while queue:
            job = queue.popleft()
            left[job] -= k
            if left[job] > 0:
                queue.append(job)
            else:
                finished.append(job)
        return finished
