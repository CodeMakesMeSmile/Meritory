class Solution {
    private int[] parent;
    private int[] rank;

    public int[] spareCable(int n, int[][] cables) {
        // Each building points to its parent, and a group's root points to itself
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        // A root's rank is an upper bound on its tree's height
        rank = new int[n];
        for (int[] cable : cables) {
            int rootA = find(cable[0]);
            int rootB = find(cable[1]);
            // Already in the same group, so this cable only closes a loop
            if (rootA == rootB) return new int[] {cable[0], cable[1]};
            // Union by rank: hang the shorter tree under the taller one
            if (rank[rootA] < rank[rootB]) {
                parent[rootA] = rootB;
            } else if (rank[rootA] > rank[rootB]) {
                parent[rootB] = rootA;
            } else {
                parent[rootB] = rootA;
                rank[rootA]++;
            }
        }
        return new int[0];
    }

    private int find(int building) {
        int root = building;
        while (parent[root] != root) root = parent[root];
        // Path compression: point every building on the way straight at the root
        int at = building;
        while (parent[at] != root) {
            int next = parent[at];
            parent[at] = root;
            at = next;
        }
        return root;
    }
}
