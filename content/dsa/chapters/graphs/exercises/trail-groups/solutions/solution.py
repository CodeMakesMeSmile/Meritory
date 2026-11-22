class Solution:
    def trailGroups(self, n: int, trails: list[list[int]]) -> int:
        # Each trail goes both ways, so it's listed under both of its campsites
        neighbours = [[] for _ in range(n)]
        for a, b in trails:
            neighbours[a].append(b)
            neighbours[b].append(a)
        seen = [False] * n
        groups = 0
        for site in range(n):
            if seen[site]:
                continue
            # An unseen campsite starts a new group, and the walk marks all of it
            groups += 1
            seen[site] = True
            # Our own stack instead of recursion, since one chain can hold every campsite
            stack = [site]
            while stack:
                at = stack.pop()
                for nxt in neighbours[at]:
                    if not seen[nxt]:
                        seen[nxt] = True
                        stack.append(nxt)
        return groups
