class Solution:
    def twoTeams(self, n: int, rivals: list[list[int]]) -> bool:
        neighbours = [[] for _ in range(n)]
        for a, b in rivals:
            neighbours[a].append(b)
            neighbours[b].append(a)
        # -1 means no team yet, and otherwise the team is 0 or 1
        team = [-1] * n
        for player in range(n):
            # Every group of rivals needs its own check, so start a walk from each unplaced player
            if team[player] != -1:
                continue
            team[player] = 0
            stack = [player]
            while stack:
                at = stack.pop()
                for rival in neighbours[at]:
                    if team[rival] == -1:
                        team[rival] = 1 - team[at]
                        stack.append(rival)
                    elif team[rival] == team[at]:
                        # Two rivals ended up on the same team, which only a circle of odd length forces
                        return False
        return True
