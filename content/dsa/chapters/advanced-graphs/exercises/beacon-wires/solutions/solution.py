class Solution:
    def leastWire(self, beacons: list[list[int]]) -> int:
        n = len(beacons)
        in_network = [False] * n
        # reach[i] is the shortest wire from the network to beacon i so far
        reach = [float("inf")] * n
        reach[0] = 0
        total = 0
        # Prim's algorithm with an array, since every pair of beacons is an edge
        for _ in range(n):
            # The beacon outside the network with the shortest wire to it joins next
            pick = min((i for i in range(n) if not in_network[i]), key=lambda i: reach[i])
            in_network[pick] = True
            total += reach[pick]
            # The new beacon may offer a shorter wire to the beacons still outside
            x, y = beacons[pick]
            for i in range(n):
                if not in_network[i]:
                    wire = abs(x - beacons[i][0]) + abs(y - beacons[i][1])
                    if wire < reach[i]:
                        reach[i] = wire
        return total
