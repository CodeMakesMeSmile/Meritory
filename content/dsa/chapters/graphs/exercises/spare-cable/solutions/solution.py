class Solution:
    def spareCable(self, n: int, cables: list[list[int]]) -> list[int]:
        # Each building points to its parent, and a group's root points to itself
        parent = list(range(n))
        # A root's rank is an upper bound on its tree's height
        rank = [0] * n

        def find(building: int) -> int:
            root = building
            while parent[root] != root:
                root = parent[root]
            # Path compression: point every building on the way straight at the root
            while parent[building] != root:
                parent[building], building = root, parent[building]
            return root

        for a, b in cables:
            root_a, root_b = find(a), find(b)
            # Already in the same group, so this cable only closes a loop
            if root_a == root_b:
                return [a, b]
            # Union by rank: hang the shorter tree under the taller one
            if rank[root_a] < rank[root_b]:
                parent[root_a] = root_b
            elif rank[root_a] > rank[root_b]:
                parent[root_b] = root_a
            else:
                parent[root_b] = root_a
                rank[root_a] += 1
        return []
