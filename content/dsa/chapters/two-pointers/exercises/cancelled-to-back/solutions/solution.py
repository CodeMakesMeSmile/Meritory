class Solution:
    def cancelledToBack(self, orders: list[int]) -> None:
        write = 0
        for read in range(len(orders)):
            if orders[read] != 0:
                orders[write] = orders[read]
                write += 1
        # Every kept order is packed at the front, so the rest are cancelled
        for i in range(write, len(orders)):
            orders[i] = 0
