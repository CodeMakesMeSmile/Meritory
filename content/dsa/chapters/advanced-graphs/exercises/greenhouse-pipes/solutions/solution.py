class Solution:
    def leastPipe(self, n: int, pipes: list[list[int]]) -> int:
        # Each greenhouse points to its parent, and a group's root points to itself
        parent = list(range(n))
        # A root's rank is an upper bound on its tree's height
        rank = [0] * n

        def find(greenhouse: int) -> int:
            root = greenhouse
            while parent[root] != root:
                root = parent[root]
            # Path compression: point every greenhouse on the way straight at the root
            while parent[greenhouse] != root:
                parent[greenhouse], greenhouse = root, parent[greenhouse]
            return root

        total = 0
        laid = 0
        # Cheapest pipes first
        for a, b, cost in sorted(pipes, key=lambda pipe: pipe[2]):
            # A tree over n greenhouses needs exactly n - 1 pipes
            if laid == n - 1:
                break
            root_a, root_b = find(a), find(b)
            # Already joined, so this pipe would only close a loop
            if root_a == root_b:
                continue
            # Union by rank: hang the shorter tree under the taller one
            if rank[root_a] < rank[root_b]:
                parent[root_a] = root_b
            elif rank[root_a] > rank[root_b]:
                parent[root_b] = root_a
            else:
                parent[root_b] = root_a
                rank[root_a] += 1
            total += cost
            laid += 1
        # Running out of pipes before n - 1 means some greenhouse can't be reached
        return total if laid == n - 1 else -1
