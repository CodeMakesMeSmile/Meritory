STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Solution:
    def islandsAfterEach(self, rows: int, cols: int, raised: list[list[int]]) -> list[int]:
        # Cell (r, c) is number r * cols + c, and a parent of -1 means it's still sea
        parent = [-1] * (rows * cols)
        # A root's rank is an upper bound on its tree's height
        rank = [0] * (rows * cols)

        def find(cell: int) -> int:
            root = cell
            while parent[root] != root:
                root = parent[root]
            # Path compression: point every cell on the way straight at the root
            while parent[cell] != root:
                parent[cell], cell = root, parent[cell]
            return root

        # Joins two groups, and says whether they were apart before
        def union(a: int, b: int) -> bool:
            root_a, root_b = find(a), find(b)
            if root_a == root_b:
                return False
            # Union by rank: hang the shorter tree under the taller one
            if rank[root_a] < rank[root_b]:
                parent[root_a] = root_b
            elif rank[root_a] > rank[root_b]:
                parent[root_b] = root_a
            else:
                parent[root_b] = root_a
                rank[root_a] += 1
            return True

        counts = []
        islands = 0
        for r, c in raised:
            cell = r * cols + c
            # Land that rises again changes nothing
            if parent[cell] == -1:
                parent[cell] = cell
                islands += 1
                # Each join with a neighbouring island merges two into one
                for dr, dc in STEPS:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols:
                        nxt = nr * cols + nc
                        if parent[nxt] != -1 and union(cell, nxt):
                            islands -= 1
            counts.append(islands)
        return counts
