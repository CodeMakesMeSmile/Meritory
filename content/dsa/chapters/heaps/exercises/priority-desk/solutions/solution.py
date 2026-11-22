class RepairDesk:
    def __init__(self):
        # A min-heap in a list, where the children of index i sit at 2i + 1 and 2i + 2
        self.items = []

    def add(self, urgency: int) -> None:
        items = self.items
        items.append(urgency)
        # Sift up: swap with the parent while the parent is less urgent
        i = len(items) - 1
        while i > 0:
            parent = (i - 1) // 2
            if items[parent] <= items[i]:
                break
            items[parent], items[i] = items[i], items[parent]
            i = parent

    def next(self) -> int:
        items = self.items
        top = items[0]
        last = items.pop()
        if items:
            # Move the last job to the root, then sift it down
            items[0] = last
            i = 0
            while True:
                left = 2 * i + 1
                right = left + 1
                smallest = i
                if left < len(items) and items[left] < items[smallest]:
                    smallest = left
                if right < len(items) and items[right] < items[smallest]:
                    smallest = right
                if smallest == i:
                    break
                items[smallest], items[i] = items[i], items[smallest]
                i = smallest
        return top

    def peek(self) -> int:
        return self.items[0]

    def size(self) -> int:
        return len(self.items)
