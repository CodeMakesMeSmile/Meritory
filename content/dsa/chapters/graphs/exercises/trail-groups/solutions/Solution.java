import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class Solution {
    public int trailGroups(int n, int[][] trails) {
        // Each trail goes both ways, so it's listed under both of its campsites
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] trail : trails) {
            neighbours.get(trail[0]).add(trail[1]);
            neighbours.get(trail[1]).add(trail[0]);
        }
        boolean[] seen = new boolean[n];
        int groups = 0;
        for (int site = 0; site < n; site++) {
            if (seen[site]) continue;
            // An unseen campsite starts a new group, and the walk marks all of it
            groups++;
            seen[site] = true;
            // Our own stack instead of recursion, since one chain can hold every campsite
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(site);
            while (!stack.isEmpty()) {
                int at = stack.pop();
                for (int next : neighbours.get(at)) {
                    if (!seen[next]) {
                        seen[next] = true;
                        stack.push(next);
                    }
                }
            }
        }
        return groups;
    }
}
