class CrateStack:
    def __init__(self):
        self.weights = []
        # lightest_so_far[i] is the lightest weight from the bottom up to crate i
        self.lightest_so_far = []

    def push(self, weight: int) -> None:
        below = self.lightest_so_far[-1] if self.lightest_so_far else weight
        self.weights.append(weight)
        self.lightest_so_far.append(min(below, weight))

    def pop(self) -> int:
        self.lightest_so_far.pop()
        return self.weights.pop()

    def top(self) -> int:
        return self.weights[-1]

    def lightest(self) -> int:
        return self.lightest_so_far[-1]
