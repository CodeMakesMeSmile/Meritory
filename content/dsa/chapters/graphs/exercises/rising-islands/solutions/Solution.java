import java.util.Arrays;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    private int[] parent;
    private int[] rank;

    public int[] islandsAfterEach(int rows, int cols, int[][] raised) {
        // Cell (r, c) is number r * cols + c, and a parent of -1 means it's still sea
        parent = new int[rows * cols];
        Arrays.fill(parent, -1);
        // A root's rank is an upper bound on its tree's height
        rank = new int[rows * cols];
        int[] counts = new int[raised.length];
        int islands = 0;
        for (int i = 0; i < raised.length; i++) {
            int r = raised[i][0];
            int c = raised[i][1];
            int cell = r * cols + c;
            // Land that rises again changes nothing
            if (parent[cell] == -1) {
                parent[cell] = cell;
                islands++;
                // Each join with a neighbouring island merges two into one
                for (int[] step : STEPS) {
                    int nr = r + step[0];
                    int nc = c + step[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    int next = nr * cols + nc;
                    if (parent[next] != -1 && union(cell, next)) islands--;
                }
            }
            counts[i] = islands;
        }
        return counts;
    }

    private int find(int cell) {
        int root = cell;
        while (parent[root] != root) root = parent[root];
        // Path compression: point every cell on the way straight at the root
        int at = cell;
        while (parent[at] != root) {
            int next = parent[at];
            parent[at] = root;
            at = next;
        }
        return root;
    }

    // Joins two groups, and says whether they were apart before
    private boolean union(int a, int b) {
        int rootA = find(a);
        int rootB = find(b);
        if (rootA == rootB) return false;
        // Union by rank: hang the shorter tree under the taller one
        if (rank[rootA] < rank[rootB]) {
            parent[rootA] = rootB;
        } else if (rank[rootA] > rank[rootB]) {
            parent[rootB] = rootA;
        } else {
            parent[rootB] = rootA;
            rank[rootA]++;
        }
        return true;
    }
}
