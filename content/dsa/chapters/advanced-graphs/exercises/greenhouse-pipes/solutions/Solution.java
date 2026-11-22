import java.util.Arrays;

class Solution {
    private int[] parent;
    private int[] rank;

    public int leastPipe(int n, int[][] pipes) {
        // Cheapest pipes first, without changing the caller's array
        int[][] sorted = pipes.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));
        // Each greenhouse points to its parent, and a group's root points to itself
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        // A root's rank is an upper bound on its tree's height
        rank = new int[n];
        int total = 0;
        int laid = 0;
        for (int[] pipe : sorted) {
            // A tree over n greenhouses needs exactly n - 1 pipes
            if (laid == n - 1) break;
            int rootA = find(pipe[0]);
            int rootB = find(pipe[1]);
            // Already joined, so this pipe would only close a loop
            if (rootA == rootB) continue;
            // Union by rank: hang the shorter tree under the taller one
            if (rank[rootA] < rank[rootB]) {
                parent[rootA] = rootB;
            } else if (rank[rootA] > rank[rootB]) {
                parent[rootB] = rootA;
            } else {
                parent[rootB] = rootA;
                rank[rootA]++;
            }
            total += pipe[2];
            laid++;
        }
        // Running out of pipes before n - 1 means some greenhouse can't be reached
        return laid == n - 1 ? total : -1;
    }

    private int find(int greenhouse) {
        int root = greenhouse;
        while (parent[root] != root) root = parent[root];
        // Path compression: point every greenhouse on the way straight at the root
        int at = greenhouse;
        while (parent[at] != root) {
            int next = parent[at];
            parent[at] = root;
            at = next;
        }
        return root;
    }
}
