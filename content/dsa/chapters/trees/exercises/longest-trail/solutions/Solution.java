// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    private int best;

    public int longestTrail(TreeNode trails) {
        best = 0;
        depth(trails);
        return best;
    }

    // Returns how many junctions deep this branch goes, and records the best bend on the way
    private int depth(TreeNode node) {
        if (node == null) return 0;
        int left = depth(node.left);
        int right = depth(node.right);
        best = Math.max(best, left + right);
        return 1 + Math.max(left, right);
    }
}
