import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

class Solution {
    public boolean twoTeams(int n, int[][] rivals) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] pair : rivals) {
            neighbours.get(pair[0]).add(pair[1]);
            neighbours.get(pair[1]).add(pair[0]);
        }
        // -1 means no team yet, and otherwise the team is 0 or 1
        int[] team = new int[n];
        Arrays.fill(team, -1);
        for (int player = 0; player < n; player++) {
            // Every group of rivals needs its own check, so start a walk from each unplaced player
            if (team[player] != -1) continue;
            team[player] = 0;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(player);
            while (!stack.isEmpty()) {
                int at = stack.pop();
                for (int rival : neighbours.get(at)) {
                    if (team[rival] == -1) {
                        team[rival] = 1 - team[at];
                        stack.push(rival);
                    } else if (team[rival] == team[at]) {
                        // Two rivals ended up on the same team, which only a circle of odd length forces
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
